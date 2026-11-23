<template>
    <div class="az-results-grid">
        <BlockResultCard
            v-for="item in items"
            :key="item.id"
            :data-cocktail-id="item.id"
            :item="item"
            @select="emit('select', item)"
        />
    </div>
</template>

<script lang="ts" setup>
import BlockResultCard from '@/components/BlockResultCard.vue'

import type { Cocktail } from '@/types/cocktailFinder'

defineProps<{
    items: Cocktail[]
}>()

const emit = defineEmits<{
    (event: 'select', item: Cocktail): void
}>()
</script>

<style lang="scss" scoped>
.az-results-grid {
    width: 100%;
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-content: start;
    gap: 36px 24px;

    @media (max-width: 767px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 480px) {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>