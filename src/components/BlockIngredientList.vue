<template>
    <div class="az-ingredient-list">
        <h3 class="az-ingredient-list__label">
            Ingredients:
        </h3>

        <BlockIngredientItem
            v-for="(ingredient, index) in ingredients"
            :key="`${ingredient.ingredient}-${index}`"
            :index="index"
            :ingredient="ingredient"
        />
    </div>
</template>

<script lang="ts" setup>
import BlockIngredientItem from '@/components/BlockIngredientItem.vue'

import type { CocktailIngredient } from '@/types/cocktailFinder'

defineProps<{
    ingredients: CocktailIngredient[]
}>()
</script>

<style lang="scss" scoped>
.az-ingredient-list {
    width: 100%;
    padding-inline-end: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    @media (max-width: 767px) {
        padding-inline-end: 0;
    }

    &__label {
        margin-block-end: 2px;
        font-size: 12px;
        line-height: 1em;
        color: $color-sand-400;
        text-transform: uppercase;
    }
}
</style>