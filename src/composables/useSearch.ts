import { computed, ref } from 'vue'

import { useCocktailDb } from '@/composables/useCocktailDb'

import type {
    Cocktail,
    CocktailAlternativeResults,
    CocktailDbDetailsApi,
    CocktailDbSearchResultApi,
    SearchType,
    SearchTypeOption
} from '@/types/cocktailFinder'

const searchTypeOptions: SearchTypeOption[] = [
    {
        label: 'Alcoholic',
        value: 'alcoholic'
    },
    {
        label: 'Non-alcoholic',
        value: 'non-alcoholic'
    },
    {
        label: 'Ingredient',
        value: 'ingredient'
    }
]

export const useSearch = () => {
    const alternativeSearchType = ref<SearchType | null>(null)
    const cocktails = ref<Cocktail[]>([])
    const error = ref<string | null>(null)
    const loading = ref(false)
    const query = ref('')
    const searched = ref(false)
    const searchType = ref<SearchType>('ingredient')

    let alternativeRequestController: AbortController | null = null
    let cachedAlternativeResults: CocktailAlternativeResults | null = null
    let searchRequestController: AbortController | null = null

    const {
        getCocktailDetails,
        getErrorMessage,
        isAbortError,
        mapCocktail,
        searchByIngredient,
        searchByName
    } = useCocktailDb()

    const searchPlaceholder = computed(() => {
        if (searchType.value === 'ingredient') {
            return 'Search by ingredient...'
        }

        return searchType.value === 'non-alcoholic'
            ? 'Search non-alcoholic cocktails...'
            : 'Search alcoholic cocktails...'
    })

    const isAlcoholic = (drink: CocktailDbSearchResultApi) => {
        return drink.strAlcoholic === 'Alcoholic'
    }

    const hydrateCocktails = async (
        drinks: CocktailDbSearchResultApi[],
        signal: AbortSignal
    ) => {
        const hydrated: CocktailDbDetailsApi[] = []
        let failedLookup: PromiseRejectedResult | undefined

        for (let index = 0; index < drinks.length; index += 6) {
            signal.throwIfAborted()

            const batch = await Promise.allSettled(drinks.slice(index, index + 6).map(async (item) => {
                if (item.strAlcoholic && item.strCategory) {
                    return item as CocktailDbDetailsApi
                }

                return getCocktailDetails(
                    item.idDrink,
                    signal
                )
            }))

            signal.throwIfAborted()

            for (const result of batch) {
                if (result.status === 'rejected') {
                    failedLookup ??= result
                } else if (result.value !== null) {
                    hydrated.push(result.value)
                }
            }
        }

        return { hydrated, failedLookup }
    }

    const getMatchingDrinks = async (
        drinks: CocktailDbSearchResultApi[],
        type: SearchType,
        signal: AbortSignal
    ) => {
        if (type === 'ingredient') {
            return { matchingDrinks: drinks, failedLookup: undefined }
        }

        const { hydrated, failedLookup } = await hydrateCocktails(drinks, signal)
        const matchingDrinks = type === 'alcoholic'
            ? hydrated.filter(isAlcoholic)
            : hydrated

        return { matchingDrinks, failedLookup }
    }

    const cancelSearch = () => {
        const cancelled = searchRequestController !== null

        searchRequestController?.abort()
        searchRequestController = null
        alternativeRequestController?.abort()
        alternativeRequestController = null
        loading.value = false
        alternativeSearchType.value = null

        if (cancelled) {
            cocktails.value = []
            error.value = null
            searched.value = false
        }

        return cancelled
    }

    const resetSearch = () => {
        cancelSearch()

        cachedAlternativeResults = null
        cocktails.value = []
        error.value = null
        searched.value = false
    }

    const loadCocktails = async (
        searchQuery: string,
        type: SearchType
    ) => {
        searchRequestController?.abort()
        alternativeRequestController?.abort()
        alternativeRequestController = null

        const requestController = new AbortController()
        let ingredientResult: Awaited<ReturnType<typeof searchByIngredient>> | null = null
        let nameResult: Awaited<ReturnType<typeof searchByName>> | null = null

        searchRequestController = requestController
        alternativeSearchType.value = null
        cocktails.value = []
        error.value = null
        loading.value = true
        searched.value = true

        const findIngredientDrinks = async (signal: AbortSignal) => {
            ingredientResult ??= await searchByIngredient(searchQuery, signal)

            return ingredientResult
        }

        const findDrinks = async (
            requestedType: SearchType,
            signal: AbortSignal
        ): Promise<{
            drinks: CocktailDbSearchResultApi[]
            failedSearch?: PromiseRejectedResult
            rejectedDrinkCount: number
        }> => {
            if (
                cachedAlternativeResults?.query === searchQuery
                && cachedAlternativeResults.type === requestedType
            ) {
                return { drinks: cachedAlternativeResults.drinks, rejectedDrinkCount: 0 }
            }

            if (requestedType === 'ingredient') {
                return findIngredientDrinks(signal)
            }

            if (requestedType === 'alcoholic') {
                const [ingredientSearch, nameSearch] = await Promise.allSettled([
                    findIngredientDrinks(signal),
                    nameResult ?? searchByName(searchQuery, signal)
                ])

                signal.throwIfAborted()

                if (nameSearch.status === 'fulfilled') {
                    nameResult = nameSearch.value
                }

                const matchingIngredients = ingredientSearch.status === 'fulfilled'
                    ? ingredientSearch.value.drinks
                    : []
                const alcoholicTitleDrinks = nameSearch.status === 'fulfilled'
                    ? nameSearch.value.drinks.filter(isAlcoholic)
                    : []
                const drinks = [...new Map([
                    ...matchingIngredients,
                    ...alcoholicTitleDrinks
                ].map((item) => [item.idDrink, item])).values()]

                const failedSearch = [ingredientSearch, nameSearch].find((result) => {
                    return result.status === 'rejected'
                })

                const rejectedIngredientCount = ingredientSearch.status === 'fulfilled'
                    ? ingredientSearch.value.rejectedDrinkCount
                    : 0
                const rejectedNameCount = nameSearch.status === 'fulfilled'
                    ? nameSearch.value.rejectedDrinkCount
                    : 0

                return {
                    drinks,
                    failedSearch,
                    rejectedDrinkCount: rejectedIngredientCount + rejectedNameCount
                }
            }

            nameResult ??= await searchByName(searchQuery, signal)

            return {
                drinks: nameResult.drinks.filter((item) => {
                    return item.strAlcoholic === 'Non alcoholic'
                }),
                rejectedDrinkCount: nameResult.rejectedDrinkCount
            }
        }

        const checkAlternativeSearch = async () => {
            const alternativeController = new AbortController()
            const signal = alternativeController.signal
            const alternativeTypes: SearchType[] = type === 'alcoholic'
                ? ['non-alcoholic', 'ingredient']
                : type === 'non-alcoholic'
                    ? ['alcoholic', 'ingredient']
                    : ['alcoholic', 'non-alcoholic']

            alternativeRequestController = alternativeController

            try {
                for (const alternativeType of alternativeTypes) {
                    try {
                        const { drinks: alternativeDrinks, failedSearch, rejectedDrinkCount } = await findDrinks(
                            alternativeType,
                            signal
                        )
                        const { matchingDrinks, failedLookup } = await getMatchingDrinks(
                            alternativeDrinks,
                            alternativeType,
                            signal
                        )

                        if (alternativeRequestController !== alternativeController) {
                            return
                        }

                        if (matchingDrinks.length) {
                            if (!failedSearch && !failedLookup && !rejectedDrinkCount) {
                                cachedAlternativeResults = {
                                    drinks: matchingDrinks,
                                    query: searchQuery,
                                    type: alternativeType
                                }
                            }

                            alternativeSearchType.value = alternativeType
                            return
                        }
                    } catch (caughtError) {
                        if (isAbortError(caughtError) || signal.aborted) {
                            return
                        }
                    }
                }
            } finally {
                if (alternativeRequestController === alternativeController) {
                    alternativeRequestController = null
                }
            }
        }

        try {
            const signal = requestController.signal
            const { drinks, failedSearch } = await findDrinks(type, signal)
            const { matchingDrinks, failedLookup } = await getMatchingDrinks(drinks, type, signal)

            if (searchRequestController !== requestController) {
                return
            }

            if (matchingDrinks.length) {
                cocktails.value = matchingDrinks.map((item) => mapCocktail(item))
                return
            }

            const failure = failedSearch ?? failedLookup

            if (failure) {
                if (!isAbortError(failure.reason)) {
                    error.value = getErrorMessage(failure.reason)
                }

                return
            }

            error.value = 'No cocktails found.'
            void checkAlternativeSearch()
        } catch (caughtError) {
            if (isAbortError(caughtError) || searchRequestController !== requestController) {
                return
            }

            cocktails.value = []
            error.value = getErrorMessage(caughtError)
        } finally {
            if (searchRequestController === requestController) {
                loading.value = false
                searchRequestController = null
            }
        }
    }

    return {
        alternativeSearchType,
        cocktails,
        error,
        loading,
        query,
        searched,
        searchPlaceholder,
        searchType,
        searchTypeOptions,
        cancelSearch,
        loadCocktails,
        resetSearch
    }
}