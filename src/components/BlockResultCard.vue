<template>
    <div
        class="az-result-card"
        :data-cocktail-id="item.id"
        role="button"
        tabindex="0"
        @click="emit('select')"
        @keydown="onKeyDown"
        @keydown.space.prevent="emit('select')"
    >
        <BlockThumb
            :image="item.image"
            :placeholder-color="item.placeholderColor"
            variant="card"
        />

        <div class="az-result-card__details">
            <span class="az-result-card__title">
                {{ item.title }}
            </span>

            <span class="az-result-card__type">
                {{ item.alcoholic || 'Alcohol content unknown' }}
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import BlockThumb from '@/components/BlockThumb.vue'

import type { Cocktail } from '@/types/cocktailFinder'

defineProps<{
    item: Cocktail
}>()

const emit = defineEmits<{
    (event: 'select'): void
}>()

const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && !event.code.endsWith('Enter')) {
        return
    }

    event.preventDefault()
    emit('select')
}
</script>

<style lang="scss" scoped>
.az-result-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 24px;
    cursor: pointer;
    text-align: center;

    &:hover {
        .az-result-card__title {
            color: $color-grey-300;
            text-shadow: 1px 1px $color-milk-400;
        }
    }

    &:focus-visible {
        @include focus-ring($color-grey-300, true);
    }

    &__details {
        display: flex;
        flex-direction: column;
        gap: 8px;
        text-transform: uppercase;
    }

    &__title {
        display: block;
        font-size: 15px;
        line-height: 1.25em;
        color: $color-milk-100;
        overflow-wrap: anywhere;
    }

    &__type {
        font-size: 12px;
        line-height: 1em;
        color: $color-sand-400;
    }
}
</style>