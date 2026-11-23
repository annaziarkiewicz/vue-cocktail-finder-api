<template>
    <section
        class="az-app"
        :class="{ 'az-app--inside-iframe': isIframe }"
    >
        <BlockSearchBar
            ref="searchBarRef"
            button-label="Search"
            :disabled="loading || (!query.trim() && !searched)"
            :model-value="query"
            :placeholder="searchPlaceholder"
            @search="searchCocktails"
            @update:model-value="updateQuery"
        >
            <template #prepend>
                <BlockSearchBarSelect
                    :model-value="searchType"
                    :options="searchTypeOptions"
                    @update:model-value="updateSearchType"
                />
            </template>
        </BlockSearchBar>

        <BlockWelcomeScreen
            v-if="!searched"
        />

        <BlockSearchResults
            v-else
            ref="searchResultsRef"
            :alternative-search-type="alternativeSearchType"
            :error="error"
            :items="cocktails"
            :loading="loading"
            @alternative-search="searchAlternativeCocktails"
            @select="openCocktail"
        />

        <BlockResultDetails
            v-if="activeCocktail"
            :key="activeCocktail.id"
            :cocktail="activeCocktail"
            :details="details"
            :error="detailsError"
            :loading="detailsLoading"
            :model-value="detailsVisible"
            :retry-enabled="detailsRetryEnabled"
            @retry="loadCocktailDetails(activeCocktail)"
            @update:model-value="updateDetailsVisibility"
        />
    </section>

    <BlockSplinter :is-iframe="isIframe" />
</template>

<script lang="ts" setup>
import {
    nextTick,
    onBeforeUnmount,
    onMounted,
    useTemplateRef
} from 'vue'

import { useDetails } from '@/composables/useDetails'
import { useIframeCommunication } from '@/composables/useIframeCommunication'
import { useSearch } from '@/composables/useSearch'
import { useUrl } from '@/composables/useUrl'

import BlockResultDetails from '@/components/BlockResultDetails.vue'
import BlockSearchBar from '@/components/BlockSearchBar.vue'
import BlockSearchBarSelect from '@/components/BlockSearchBarSelect.vue'
import BlockSearchResults from '@/components/BlockSearchResults.vue'
import BlockSplinter from '@/components/BlockSplinter.vue'
import BlockWelcomeScreen from '@/components/BlockWelcomeScreen.vue'

import type {
    Cocktail,
    CocktailSearchUrlState,
    SearchType
} from '@/types/cocktailFinder'

const { isIframe } = useIframeCommunication()

const searchBarRef = useTemplateRef<InstanceType<typeof BlockSearchBar>>('searchBarRef')
const searchResultsRef = useTemplateRef<InstanceType<typeof BlockSearchResults>>('searchResultsRef')

let cocktailOpenedFromResults = false
let resultsSearchState: CocktailSearchUrlState | null = null

const {
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
} = useSearch()

const {
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
} = useDetails()

const {
    getCocktailStateFromUrl,
    getSearchStateFromUrl,
    getUrlParamsWithoutCocktail,
    goBackFromCocktailDetails,
    isSearchType,
    shouldSkipPopstateLoad,
    updateUrl
} = useUrl()

const resetApplication = () => {
    resetSearch()
    resetDetails()
}

const loadSearchResults = (
    searchQuery: string,
    type: SearchType
) => {
    resetDetails()
    resultsSearchState = { query: searchQuery, type }

    return loadCocktails(searchQuery, type)
}

const searchCocktails = async () => {
    const searchQuery = query.value.trim()

    if (!searchQuery) {
        query.value = ''

        updateUrl({})

        resetApplication()
        return
    }

    const startsFromWelcome = !getSearchStateFromUrl().query && !getCocktailStateFromUrl()
    const replaceCurrentEntry = startsFromWelcome && window.history.state?.previousEntryIsWelcome === true

    query.value = searchQuery

    updateUrl(
        {
            search: searchQuery,
            type: searchType.value
        },
        replaceCurrentEntry,
        {
            previousEntryIsWelcome: startsFromWelcome
        }
    )

    await loadSearchResults(searchQuery, searchType.value)
}

const searchAlternativeCocktails = async () => {
    const type = alternativeSearchType.value

    if (!type) {
        return
    }

    searchType.value = type
    await searchCocktails()
}

const cancelPendingSearch = () => {
    if (!cancelSearch()) {
        return
    }

    const cocktail = getCocktailStateFromUrl()

    if (!cocktail) {
        updateUrl({}, true, {
            previousEntryIsWelcome: window.history.state?.previousEntryIsWelcome === true
        })
    } else if (cocktail.id) {
        updateUrl(
            {
                cocktail: cocktail.id
            },
            true,
            window.history.state ?? {}
        )
    }
}

const updateQuery = (value: string) => {
    cancelPendingSearch()
    query.value = value
}

const updateSearchType = (value: string) => {
    if (!isSearchType(value)) {
        return
    }

    cancelPendingSearch()
    searchType.value = value
}

const openCocktail = async (cocktail: Cocktail) => {
    cancelSearch()
    cocktailOpenedFromResults = true

    const params = getUrlParamsWithoutCocktail()

    params.cocktail = cocktail.id

    updateUrl(
        params,
        false,
        {
            cocktailDetails: true
        }
    )

    await showCocktailDetails(cocktail)
}

const restoreSearchFocus = async (cocktailId: string | null = null) => {
    await nextTick()

    if (activeCocktail.value) {
        return
    }

    if (cocktailId && searchResultsRef.value?.focusCocktail(cocktailId)) {
        return
    }

    searchBarRef.value?.focusInput()
}

const updateDetailsVisibility = (value: boolean) => {
    if (value) {
        detailsVisible.value = true
        return
    }

    const cocktailId = cocktailOpenedFromResults ? activeCocktail.value?.id ?? null : null

    resetDetails()
    cocktailOpenedFromResults = false

    if (goBackFromCocktailDetails()) {
        void restoreSearchFocus(cocktailId)
        return
    }

    updateUrl(getUrlParamsWithoutCocktail(), true)
    void restoreSearchFocus(cocktailId)
}

const handleUrlChange = () => {
    const cocktailUrlState = getCocktailStateFromUrl()
    const returnToSearchInput = activeCocktail.value && !cocktailOpenedFromResults
    const returnToCocktailId = cocktailOpenedFromResults ? activeCocktail.value?.id ?? null : null
    const searchState = getSearchStateFromUrl()
    const sameSearch = searched.value
        && resultsSearchState?.query === searchState.query
        && resultsSearchState.type === searchState.type

    query.value = searchState.query
    searchType.value = searchState.type

    cocktailOpenedFromResults = false

    if (!sameSearch && searchState.query) {
        void loadSearchResults(searchState.query, searchState.type)
    } else {
        resetDetails()

        if (!searchState.query) {
            resetSearch()
        }
    }

    if (cocktailUrlState) {
        cocktailOpenedFromResults = window.history.state?.cocktailDetails === true
        void showCocktailDetailsById(
            cocktailUrlState.id,
            cocktailUrlState.title
        )
    } else if (returnToCocktailId) {
        void restoreSearchFocus(returnToCocktailId)
    } else if (returnToSearchInput) {
        void restoreSearchFocus()
    }
}

const handlePopstate = () => {
    if (!shouldSkipPopstateLoad()) {
        handleUrlChange()
    }
}

onMounted(() => {
    window.addEventListener('popstate', handlePopstate)
    handleUrlChange()
})

onBeforeUnmount(() => {
    window.removeEventListener('popstate', handlePopstate)
    cancelSearch()
    resetDetails()
})
</script>

<style lang="scss" scoped>
.az-app {
    position: relative;
    width: 100%;
    max-width: 960px;
    min-height: 680px;
    padding: 136px 36px 24px;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    gap: 36px;
    background: $color-milk-500;

    @media (max-width: 767px) {
        padding-inline: 24px;
    }

    @media (max-width: 480px) {
        padding-block-start: 204px;
    }

    &:not(.az-app--inside-iframe) {
        margin-block-start: 24px;
    }
}
</style>