import type {
    Cocktail,
    CocktailDbDetailsApi,
    CocktailDbDetailsResponseApi,
    CocktailDbSearchApi,
    CocktailDbSearchResultApi,
    PlaceholderColor
} from '@/types/cocktailFinder'

const apiUrl = 'https://www.thecocktaildb.com/api/json/v1/1'
const cocktailDetailsCache = new Map<string, CocktailDbDetailsApi>()
const pendingCocktailDetails = new Map<string, {
    request: Promise<CocktailDbDetailsApi | null>
    signal: AbortSignal
}>()
const placeholderColors: PlaceholderColor[] = ['mint', 'navy', 'rose']
const searchTextFields = ['strAlcoholic', 'strCategory', 'strDrinkThumb']
const detailsTextFields = ['strGlass', 'strIBA', 'strInstructions', 'strTags']
const ingredientTextField = /^str(?:Ingredient|Measure)(?:[1-9]|1[0-5])$/

export const useCocktailDb = () => {
    const fetchJson = async <T>(
        path: string,
        signal: AbortSignal
    ): Promise<T> => {
        const response = await fetch(`${apiUrl}${path}`, {
            signal
        })

        if (!response.ok) {
            throw new Error(`Unable to load cocktail data (${response.status}). Please try again.`)
        }

        const text = await response.text()

        if (!text.trim()) {
            throw new Error('The cocktail API returned an empty response. Please try again.')
        }

        try {
            return JSON.parse(text) as T
        } catch {
            throw new Error('The cocktail API returned an invalid response. Please try again.')
        }
    }

    const getErrorMessage = (caughtError: unknown) => {
        if (caughtError instanceof Error) {
            return caughtError.message
        }

        if (caughtError && typeof caughtError === 'object') {
            const errorEntry = Object.entries(caughtError)[0]

            if (errorEntry) {
                const [key, value] = errorEntry

                return `${key}: ${String(value)}`
            }
        }

        return 'Unknown error.'
    }

    const isCocktailId = (id: unknown): id is string => {
        return typeof id === 'string'
            && /^\d+$/.test(id)
            && Number.isSafeInteger(Number(id))
            && Number(id) > 0
    }

    const getDrinks = <T extends CocktailDbSearchResultApi>(
        response: { drinks: T[] | null | string },
        includeDetails = false
    ): { drinks: T[], rejectedDrinkCount: number } => {
        if (!response || typeof response !== 'object' || Array.isArray(response)) {
            throw new Error('Invalid cocktail data returned by the API.')
        }

        if (response.drinks === null || response.drinks === 'no data found') {
            return { drinks: [], rejectedDrinkCount: 0 }
        }

        if (!Array.isArray(response.drinks)) {
            throw new Error(
                typeof response.drinks === 'string'
                    ? response.drinks
                    : 'Invalid cocktail data returned by the API.'
            )
        }

        const validDrinks = response.drinks.filter((drink) => {
            if (!isCocktailId(drink?.idDrink) || typeof drink.strDrink !== 'string') {
                return false
            }

            return Object.entries(drink).every(([key, value]) => {
                const isUsedTextField = searchTextFields.includes(key)
                    || (includeDetails && (
                        detailsTextFields.includes(key) || ingredientTextField.test(key)
                    ))

                return !isUsedTextField
                    || value === null
                    || typeof value === 'string'
            })
        })

        if (response.drinks.length && !validDrinks.length) {
            throw new Error('Invalid cocktail data returned by the API.')
        }

        const drinks = new Map<string, T>()

        for (const drink of validDrinks) {
            if (!drinks.has(drink.idDrink)) {
                drinks.set(drink.idDrink, drink)
            }
        }

        return {
            drinks: [...drinks.values()],
            rejectedDrinkCount: response.drinks.length - validDrinks.length
        }
    }

    const getDetailsDrinks = (
        response: CocktailDbDetailsResponseApi
    ) => {
        const { drinks, rejectedDrinkCount } = getDrinks(response, true)

        return {
            drinks: drinks.map((drink) => ({
                ...drink,
                strAlcoholic: drink.strAlcoholic ?? null,
                strCategory: drink.strCategory ?? null
            })),
            rejectedDrinkCount
        }
    }

    const getCocktailDetails = async (
        id: string,
        signal: AbortSignal
    ): Promise<CocktailDbDetailsApi | null> => {
        signal.throwIfAborted()

        const cachedDetails = cocktailDetailsCache.get(id)

        if (cachedDetails) {
            return cachedDetails
        }

        const pending = pendingCocktailDetails.get(id)

        if (pending && !pending.signal.aborted) {
            try {
                const details = await pending.request

                signal.throwIfAborted()
                return details
            } catch (caughtError) {
                signal.throwIfAborted()

                if (!pending.signal.aborted) {
                    throw caughtError
                }

                return getCocktailDetails(id, signal)
            }
        }

        const request = fetchJson<CocktailDbDetailsResponseApi>(
            `/lookup.php?i=${encodeURIComponent(id)}`,
            signal
        ).then((response) => {
            signal.throwIfAborted()

            const { drinks } = getDetailsDrinks(response)
            const details = drinks.find((drink) => drink.idDrink === id) ?? null

            if (drinks.length && !details) {
                throw new Error('The cocktail API returned details for a different cocktail. Please try again.')
            }

            if (details) {
                cocktailDetailsCache.set(id, details)
            }

            return details
        })

        pendingCocktailDetails.set(id, { request, signal })

        try {
            return await request
        } finally {
            if (pendingCocktailDetails.get(id)?.request === request) {
                pendingCocktailDetails.delete(id)
            }
        }
    }

    const getPlaceholderColor = (title: string): PlaceholderColor => {
        const value = [...title].reduce((sum, character) => {
            return sum + character.charCodeAt(0)
        }, 0)

        return placeholderColors[value % placeholderColors.length] ?? 'mint'
    }

    const isAbortError = (caughtError: unknown) => {
        return (
            caughtError instanceof Error
            && caughtError.name === 'AbortError'
        )
    }

    const mapCocktail = (
        cocktail: CocktailDbSearchResultApi
    ): Cocktail => {
        return {
            alcoholic: cocktail.strAlcoholic?.trim() || '',
            category: cocktail.strCategory?.trim() || '',
            id: cocktail.idDrink,
            image: cocktail.strDrinkThumb?.trim() || null,
            placeholderColor: getPlaceholderColor(cocktail.strDrink.trim() || 'Cocktail'),
            title: cocktail.strDrink.trim() || 'Cocktail'
        }
    }

    const searchByIngredient = async (
        ingredient: string,
        signal: AbortSignal
    ) => {
        const response = await fetchJson<CocktailDbSearchApi>(
            `/filter.php?i=${encodeURIComponent(ingredient.replace(/\s+/g, '_'))}`,
            signal
        )

        return getDrinks(response)
    }

    const searchByName = async (
        searchQuery: string,
        signal: AbortSignal
    ) => {
        const response = await fetchJson<CocktailDbDetailsResponseApi>(
            `/search.php?s=${encodeURIComponent(searchQuery)}`,
            signal
        )

        const result = getDetailsDrinks(response)

        signal.throwIfAborted()

        result.drinks.forEach((drink) => {
            cocktailDetailsCache.set(drink.idDrink, drink)
        })

        return result
    }

    return {
        getCocktailDetails,
        getErrorMessage,
        getPlaceholderColor,
        isAbortError,
        isCocktailId,
        mapCocktail,
        searchByIngredient,
        searchByName
    }
}