import type {
    CocktailSearchUrlState,
    CocktailUrlState,
    SearchType
} from '@/types/cocktailFinder'

export const useUrl = () => {
    let skipNextPopstateLoad = false

    const isSearchType = (value: string): value is SearchType => {
        return value === 'ingredient'
            || value === 'alcoholic'
            || value === 'non-alcoholic'
    }

    const getSearchStateFromUrl = (): CocktailSearchUrlState => {
        const searchParams = new URLSearchParams(window.location.search)
        const type = searchParams.get('type') ?? 'ingredient'

        return {
            query: searchParams.get('search')?.trim() ?? '',
            type: isSearchType(type) ? type : 'ingredient'
        }
    }

    const getCocktailStateFromUrl = (): CocktailUrlState | null => {
        const searchParams = new URLSearchParams(window.location.search)
        const cocktail = searchParams.get('cocktail')?.trim() ?? ''
        const legacyId = searchParams.get('cocktailId')

        if (legacyId !== null) {
            return {
                id: legacyId.trim(),
                title: cocktail
            }
        }

        if (!searchParams.has('cocktail')) {
            return null
        }

        return {
            id: cocktail,
            title: ''
        }
    }

    const getUrlParamsWithoutCocktail = () => {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.search)
        )

        delete params.cocktail
        delete params.cocktailId

        return params
    }

    const updateUrl = (
        params: Record<string, string | null>,
        replaceCurrentEntry = false,
        state: Record<string, boolean> = {}
    ) => {
        const url = new URL(window.location.href)

        url.search = ''

        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value)
            }
        })

        if (replaceCurrentEntry) {
            window.history.replaceState(state, '', url)
            return
        }

        window.history.pushState(state, '', url)
    }

    const goBackFromCocktailDetails = () => {
        if (window.history.state?.cocktailDetails !== true) {
            return false
        }

        skipNextPopstateLoad = true
        window.history.back()
        return true
    }

    const shouldSkipPopstateLoad = () => {
        const skip = skipNextPopstateLoad

        skipNextPopstateLoad = false
        return skip
    }

    return {
        getCocktailStateFromUrl,
        getSearchStateFromUrl,
        getUrlParamsWithoutCocktail,
        goBackFromCocktailDetails,
        isSearchType,
        shouldSkipPopstateLoad,
        updateUrl
    }
}