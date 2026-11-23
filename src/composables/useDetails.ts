import { ref } from 'vue'

import { useCocktailDb } from '@/composables/useCocktailDb'

import type {
    Cocktail,
    CocktailDbDetailsApi,
    CocktailDetails,
    CocktailIngredient
} from '@/types/cocktailFinder'

export const useDetails = () => {
    const activeCocktail = ref<Cocktail | null>(null)
    const details = ref<CocktailDetails | null>(null)
    const detailsError = ref<string | null>(null)
    const detailsLoading = ref(false)
    const detailsRetryEnabled = ref(true)
    const detailsVisible = ref(false)

    let detailsRequestController: AbortController | null = null

    const {
        getCocktailDetails,
        getErrorMessage,
        getPlaceholderColor,
        isAbortError,
        isCocktailId,
        mapCocktail
    } = useCocktailDb()

    const getIngredients = (
        cocktail: CocktailDbDetailsApi
    ): CocktailIngredient[] => {
        const ingredients: CocktailIngredient[] = []

        for (let index = 1; index <= 15; index += 1) {
            const ingredientKey = (
                `strIngredient${index}` as keyof CocktailDbDetailsApi
            )
            const measureKey = `strMeasure${index}` as keyof CocktailDbDetailsApi
            const ingredient = cocktail[ingredientKey]
            const measure = cocktail[measureKey]

            if (typeof ingredient !== 'string' || !ingredient.trim()) {
                continue
            }

            ingredients.push({
                ingredient: ingredient.trim(),
                measure: typeof measure === 'string' && measure.trim()
                    ? measure.trim()
                    : null
            })
        }

        return ingredients
    }

    const mapDetailsToCocktailDetails = (
        item: CocktailDbDetailsApi,
        cocktail: Cocktail
    ): CocktailDetails => {
        return {
            ...cocktail,
            glass: item.strGlass?.trim() || 'Unknown glass',
            ibaClassification: item.strIBA?.trim() || null,
            ingredients: getIngredients(item),
            instructions: item.strInstructions?.trim()
                || 'No instructions available.',
            tags: item.strTags?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? []
        }
    }

    const createPlaceholderCocktail = (
        id: string,
        title = ''
    ): Cocktail => {
        return {
            alcoholic: 'Unknown',
            category: 'Other',
            id,
            image: null,
            placeholderColor: getPlaceholderColor(title || 'Cocktail'),
            title: title || 'Cocktail'
        }
    }

    const resetDetails = () => {
        detailsRequestController?.abort()
        detailsRequestController = null

        activeCocktail.value = null
        details.value = null
        detailsError.value = null
        detailsLoading.value = false
        detailsRetryEnabled.value = true
        detailsVisible.value = false
    }

    const loadCocktailDetails = async (cocktail: Cocktail) => {
        detailsRequestController?.abort()
        detailsRequestController = null
        details.value = null
        detailsError.value = null
        detailsLoading.value = false
        detailsRetryEnabled.value = true

        if (!isCocktailId(cocktail.id)) {
            detailsError.value = 'Invalid cocktail ID.'
            detailsRetryEnabled.value = false
            return
        }

        const requestController = new AbortController()

        detailsRequestController = requestController
        detailsLoading.value = true

        try {
            const cocktailDetails = await getCocktailDetails(
                cocktail.id,
                requestController.signal
            )

            if (detailsRequestController !== requestController) {
                return
            }

            if (!cocktailDetails) {
                detailsError.value = 'Cocktail details not found.'
                detailsRetryEnabled.value = false
                return
            }

            const mappedCocktail = mapCocktail(cocktailDetails)

            activeCocktail.value = mappedCocktail
            details.value = mapDetailsToCocktailDetails(
                cocktailDetails,
                mappedCocktail
            )
        } catch (caughtError) {
            if (
                isAbortError(caughtError)
                || detailsRequestController !== requestController
            ) {
                return
            }

            detailsError.value = getErrorMessage(caughtError)
        } finally {
            if (detailsRequestController === requestController) {
                detailsLoading.value = false
                detailsRequestController = null
            }
        }
    }

    const showCocktailDetails = async (cocktail: Cocktail) => {
        activeCocktail.value = cocktail
        detailsVisible.value = true

        await loadCocktailDetails(cocktail)
    }

    const showCocktailDetailsById = async (
        id: string,
        title = ''
    ) => {
        const cocktail = createPlaceholderCocktail(id, title)

        activeCocktail.value = cocktail
        detailsVisible.value = true

        await loadCocktailDetails(cocktail)
    }

    return {
        activeCocktail,
        details,
        detailsError,
        detailsLoading,
        detailsRetryEnabled,
        detailsVisible,
        loadCocktailDetails,
        resetDetails,
        showCocktailDetails,
        showCocktailDetailsById
    }
}