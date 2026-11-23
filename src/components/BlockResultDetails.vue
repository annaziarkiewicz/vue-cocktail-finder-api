<template>
    <BlockModal
        :model-value="modelValue"
        title="Cocktail details"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <div class="az-result-details">
            <div class="az-result-details__start">
                <BlockThumb
                    :image="cocktail.image"
                    :placeholder-color="cocktail.placeholderColor"
                    :size="320"
                    variant="details"
                />
            </div>

            <div class="az-result-details__end">
                <div class="az-result-details__type">
                    {{ cocktail.alcoholic }}
                </div>

                <h2 class="az-result-details__title">
                    {{ cocktail.title }}
                </h2>

                <BlockDetails
                    :details="details"
                    :error="error"
                    :loading="loading"
                    :retry-enabled="retryEnabled"
                    @retry="emit('retry')"
                />
            </div>
        </div>
    </BlockModal>
</template>

<script lang="ts" setup>
import BlockDetails from '@/components/BlockDetails.vue'
import BlockModal from '@/components/BlockModal.vue'
import BlockThumb from '@/components/BlockThumb.vue'

import type {
    Cocktail,
    CocktailDetails
} from '@/types/cocktailFinder'

defineProps<{
    cocktail: Cocktail
    details: CocktailDetails | null
    error: string | null
    loading: boolean
    modelValue: boolean
    retryEnabled: boolean
}>()

const emit = defineEmits<{
    (event: 'retry'): void
    (event: 'update:modelValue', value: boolean): void
}>()
</script>

<style lang="scss" scoped>
.az-result-details {
    width: 100%;
    padding: 36px;
    display: flex;
    gap: 48px;

    @media (max-width: 767px) {
        padding: 24px;
        flex-direction: column;
        gap: 0;

        :deep(.az-details) {
            overflow: visible;
            flex: none;
            order: 4;
        }
    }

    &__start {
        width: 320px;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        gap: 36px;

        @media (max-width: 767px) {
            width: 100%;
            margin-block-end: 24px;
            gap: 24px;
            order: 3;
        }
    }

    &__end {
        min-width: 0;
        min-height: 0;
        display: flex;
        flex: 1;
        flex-direction: column;

        @media (max-width: 767px) {
            display: contents;
        }
    }

    &__type {
        font-size: 12px;
        line-height: 1em;
        color: $color-sand-400;
        text-transform: uppercase;

        @media (max-width: 767px) {
            order: 1;
        }
    }

    &__title {
        margin-block-end: 12px;
        font-size: 36px;
        line-height: 1.25em;
        color: $color-milk-100;
        text-transform: uppercase;
        overflow-wrap: anywhere;

        &:before {
            content: '';
            width: 38px;
            height: 26px;
            float: right;

            @media (max-width: 767px) {
                width: 44px;
                height: 32px;
            }
        }

        @media (max-width: 767px) {
            order: 2;
        }

        @media (max-width: 480px) {
            font-size: 24px;
        }
    }
}
</style>