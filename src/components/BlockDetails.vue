<template>
    <div
        ref="detailsRef"
        :aria-busy="loading"
        aria-label="Cocktail details"
        class="az-details"
        role="region"
        :tabindex="isScrollable ? 0 : -1"
    >
        <BlockLoaderDots v-if="loading" />

        <div v-else-if="error" class="az-details__error">
            <BlockError :message="error" />

            <button
                v-if="retryEnabled"
                class="az-details__retry"
                type="button"
                @click="retryDetails"
            >
                Retry
            </button>
        </div>

        <template v-else-if="details">
            <BlockIngredientList :ingredients="details.ingredients" />

            <div class="az-details__instructions">
                <h3 class="az-details__label">Instructions:</h3>

                <div class="az-details__instructions-value">
                    {{ details.instructions }}
                </div>
            </div>

            <div class="az-details__list">
                <h3 class="az-details__list-label">
                    Details:
                </h3>

                <div v-if="details.category" class="az-details__item">
                    <span class="az-details__item-label">
                        Category:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.category }}
                    </span>
                </div>

                <div v-if="details.glass" class="az-details__item">
                    <span class="az-details__item-label">
                        Serve in:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.glass }}
                    </span>
                </div>

                <div v-if="details.ibaClassification" class="az-details__item">
                    <span class="az-details__item-label">
                        IBA classification:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.ibaClassification }}
                    </span>
                </div>

                <div v-if="details.tags.length" class="az-details__item">
                    <span class="az-details__item-label">
                        Tags:
                    </span>

                    <span class="az-details__item-value">
                        {{ details.tags.join(', ') }}
                    </span>
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import {
    nextTick,
    onMounted,
    onUnmounted,
    ref,
    watch
} from 'vue'

import BlockError from '@/components/BlockError.vue'
import BlockIngredientList from '@/components/BlockIngredientList.vue'
import BlockLoaderDots from '@/components/BlockLoaderDots.vue'

import type { CocktailDetails } from '@/types/cocktailFinder'

const props = withDefaults(defineProps<{
    details: CocktailDetails | null
    error: string | null
    loading: boolean
    retryEnabled?: boolean
}>(), {
    retryEnabled: true
})

const detailsRef = ref<HTMLElement | null>(null)
const isScrollable = ref(false)

const emit = defineEmits<{
    (event: 'retry'): void
}>()

const updateScrollable = () => {
    if (!detailsRef.value || window.innerWidth <= 767) {
        isScrollable.value = false
        return
    }

    isScrollable.value = detailsRef.value.scrollHeight > detailsRef.value.clientHeight
}

const retryDetails = (event: MouseEvent) => {
    const button = event.currentTarget

    if (button instanceof HTMLElement) {
        button.closest<HTMLElement>('.az-details')?.focus({ preventScroll: true })
    }

    emit('retry')
}

watch(
    () => [
        props.details,
        props.error,
        props.loading,
        props.retryEnabled
    ],
    async () => {
        await nextTick()
        updateScrollable()
    }
)

onMounted(async () => {
    await nextTick()
    updateScrollable()
    window.addEventListener('resize', updateScrollable)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateScrollable)
})
</script>

<style lang="scss" scoped>
.az-details {
    overflow-y: auto;
    min-width: 0;
    min-height: 0;
    padding-block: 8px 4px;
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    gap: 24px;

    &:focus-visible {
        @include focus-ring($color-grey-300, 4px);
    }

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: $color-milk-400;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: $color-milk-200;
        border-radius: 4px;
    }

    &__error {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;
    }

    &__retry {
        padding: 16px 24px;
        background: $color-rose-100;
        border-radius: 8px;
        cursor: pointer;
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

    &__list {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;

        &-label {
            font-size: 12px;
            line-height: 1em;
            color: $color-sand-400;
            text-transform: uppercase;
        }
    }

    &__item {
        font-size: 20px;
        line-height: 1.5em;

        &-label {
            color: $color-milk-200;
        }

        &-value {
            color: $color-milk-100;
            overflow-wrap: anywhere;
        }
    }

    &__instructions {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 4px;

        &-value {
            padding-inline-end: 12px;
            font-size: 20px;
            line-height: 1.5em;
            color: $color-milk-100;
            overflow-wrap: anywhere;

            @media (max-width: 767px) {
                padding: 0;
            }
        }
    }

    &__label {
        font-size: 12px;
        line-height: 1em;
        color: $color-sand-400;
        text-transform: uppercase;
    }
}
</style>