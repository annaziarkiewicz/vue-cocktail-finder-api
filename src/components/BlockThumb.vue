<template>
    <div
        class="az-thumb"
        :class="`az-thumb--${variant}`"
        :style="{ '--thumb-size': `${size}px` }"
    >
        <div v-if="loading" class="az-thumb__image az-thumb__image--loading">
            <BlockLoaderRing
                aria-hidden="true"
                :size="loaderSize"
            />
        </div>

        <img
            v-if="image && !imageMissing"
            v-show="!loading"
            class="az-thumb__image"
            :src="image"
            alt=""
            @error="onImageError"
            @load="onImageLoad"
        >

        <div
            v-if="imageMissing"
            class="az-thumb__image az-thumb__image--empty"
            :class="`az-thumb__image--${placeholderColor}`"
        >
            No image
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    ref,
    watch
} from 'vue'

import BlockLoaderRing from '@/components/BlockLoaderRing.vue'

import type {
    PlaceholderColor,
    ThumbVariant
} from '@/types/cocktailFinder'

const props = withDefaults(defineProps<{
    image: string | null
    placeholderColor: PlaceholderColor
    size?: number
    variant?: ThumbVariant
}>(), {
    size: 180,
    variant: 'details'
})

const imageMissing = ref(!props.image)
const loading = ref(Boolean(props.image))

const loaderSize = computed(() => props.variant === 'card' ? 24 : 36)

const onImageError = () => {
    imageMissing.value = true
    loading.value = false
}

const onImageLoad = () => {
    loading.value = false
}

watch(() => props.image, (image) => {
    imageMissing.value = !image
    loading.value = Boolean(image)
})
</script>

<style lang="scss" scoped>
.az-thumb {
    position: relative;
    width: var(--thumb-size);
    max-width: 100%;
    aspect-ratio: 1;

    &--card {
        margin: 0 auto;

        .az-thumb__image {
            box-shadow: none;
        }
    }

    &__image {
        width: 100%;
        height: 100%;
        object-fit: cover;

        &--loading,
        &--empty {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        &--loading {
            background: $color-milk-300;
        }

        &--empty {
            box-shadow: 0 24px 24px -24px $color-grey-200;
            font-size: 12px;
            line-height: 1em;
            text-transform: uppercase;
        }

        &--mint {
            background: $color-mint-200;
            color: $color-mint-400;
        }

        &--navy {
            background: $color-navy-100;
            color: $color-navy-300;
        }

        &--rose {
            background: $color-rose-100;
            color: $color-rose-300;
        }
    }
}
</style>