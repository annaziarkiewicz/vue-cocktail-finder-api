<template>
    <span
        aria-atomic="true"
        class="az-search-results-status"
        role="status"
    >
        {{ resultsStatus }}
    </span>

    <div
        ref="searchResultsRef"
        :aria-busy="loading"
        aria-label="Search results"
        class="az-search-results"
        role="region"
        tabindex="-1"
    >
        <BlockLoaderDots v-if="loading" />

        <template v-else-if="error">
            <BlockError
                :class="{ 'az-search-results__error--with-alternative': alternativeSearchType }"
                :message="error"
            />

            <button
                v-if="alternativeSearchType"
                class="az-search-results__button"
                type="button"
                @click="searchAlternative"
            >
                {{ alternativeSearchLabel }}
            </button>
        </template>

        <BlockResultsGrid
            v-else
            :items="items"
            @select="emit('select', $event)"
        />
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    useTemplateRef
} from 'vue'

import BlockError from '@/components/BlockError.vue'
import BlockLoaderDots from '@/components/BlockLoaderDots.vue'
import BlockResultsGrid from '@/components/BlockResultsGrid.vue'

import type {
    Cocktail,
    SearchType
} from '@/types/cocktailFinder'

const props = defineProps<{
    alternativeSearchType?: SearchType | null
    error: string | null
    items: Cocktail[]
    loading: boolean
}>()

const emit = defineEmits<{
    (event: 'alternative-search'): void
    (event: 'select', item: Cocktail): void
}>()

const searchResultsRef = useTemplateRef<HTMLElement>('searchResultsRef')

const focusCocktail = (id: string) => {
    const cards = searchResultsRef.value?.querySelectorAll<HTMLElement>('[data-cocktail-id]')
    const card = Array.from(cards ?? []).find((item) => item.dataset.cocktailId === id)

    card?.focus()

    return card !== undefined && document.activeElement === card
}

defineExpose({ focusCocktail })

const searchAlternative = (event: MouseEvent) => {
    const button = event.currentTarget

    if (button instanceof HTMLElement) {
        button.closest<HTMLElement>('.az-search-results')?.focus({ preventScroll: true })
    }

    emit('alternative-search')
}

const alternativeSearchLabel = computed(() => {
    if (props.alternativeSearchType === 'alcoholic') {
        return 'Search alcoholic cocktails'
    }

    if (props.alternativeSearchType === 'non-alcoholic') {
        return 'Search non-alcoholic cocktails by name'
    }

    return 'Search by cocktail ingredient'
})

const resultsStatus = computed(() => {
    if (props.loading) {
        return ''
    }

    if (props.error) {
        return props.alternativeSearchType
            ? `Alternative search available. ${alternativeSearchLabel.value}.`
            : ''
    }

    if (!props.items.length) {
        return ''
    }

    const resultLabel = props.items.length === 1 ? 'result' : 'results'

    return `Search complete. Showing ${props.items.length} ${resultLabel}.`
})
</script>

<style lang="scss" scoped>
.az-search-results-status {
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    white-space: nowrap;
    clip-path: inset(50%);
}

.az-search-results {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    &:focus-visible {
        @include focus-ring($color-grey-300, 4px);
    }

    &__error--with-alternative {
        flex: 0;
    }

    &__button {
        margin-block: 12px auto;
        padding: 16px 24px;
        background: $color-rose-100;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 500;
        color: $color-milk-200;
        text-transform: uppercase;
        transition: .25s;

        &:focus-visible {
            @include focus-ring($color-grey-300, 8px);
        }

        &:hover {
            background: $color-rose-200;
        }
    }
}
</style>