<template>
    <div class="az-ingredient">
        <span class="az-ingredient__number">
            {{ String(index + 1).padStart(2, '0') }}
        </span>

        <span class="az-ingredient__title">
            {{ ingredient.ingredient }}
        </span>

        <span v-if="ingredient.measure" class="az-ingredient__measure">
            {{ ingredient.measure }}
        </span>
    </div>
</template>

<script lang="ts" setup>
import type { CocktailIngredient } from '@/types/cocktailFinder'

defineProps<{
    index: number
    ingredient: CocktailIngredient
}>()
</script>

<style lang="scss" scoped>
.az-ingredient {
    display: flex;
    align-items: flex-start;
    font-size: 20px;
    line-height: 1.5em;
    color: $color-milk-100;

    &__number {
        width: 32px;
        flex-shrink: 0;
        color: $color-milk-300;
    }

    &__title {
        min-width: 0;
        flex: 1;
        overflow-wrap: anywhere;
    }

    &__measure {
        min-width: 0;
        max-width: 45%;
        margin-inline-start: 12px;
        color: $color-sand-400;
        text-align: right;
        overflow-wrap: anywhere;
    }
}
</style>