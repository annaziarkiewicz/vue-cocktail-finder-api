<template>
    <div class="az-welcome">
        <a
            v-for="item in items"
            :key="item.name"
            :aria-label="`Search alcoholic cocktails with ${item.name}`"
            class="az-welcome__tile"
            :href="getSearchUrl(item.name)"
        >
            <img
                class="az-welcome__image"
                alt=""
                :src="item.image"
            >

            <div class="az-welcome__name">
                {{ item.name }}
            </div>
        </a>
    </div>
</template>

<script lang="ts" setup>
import beer from '@/assets/beer.png'
import bourbon from '@/assets/bourbon.png'
import brandy from '@/assets/brandy.png'
import champagne from '@/assets/champagne.png'
import cider from '@/assets/cider.png'
import gin from '@/assets/gin.png'
import liqueur from '@/assets/liqueur.png'
import rum from '@/assets/rum.png'
import tequila from '@/assets/tequila.png'
import vodka from '@/assets/vodka.png'
import whiskey from '@/assets/whiskey.png'
import wine from '@/assets/wine.png'

import type { WelcomeItem } from '@/types/cocktailFinder'

const items: WelcomeItem[] = [
    {
        image: beer,
        name: 'Beer'
    },
    {
        image: vodka,
        name: 'Vodka'
    },
    {
        image: wine,
        name: 'Wine'
    },
    {
        image: champagne,
        name: 'Champagne'
    },
    {
        image: liqueur,
        name: 'Liqueur'
    },
    {
        image: cider,
        name: 'Cider'
    },
    {
        image: rum,
        name: 'Rum'
    },
    {
        image: whiskey,
        name: 'Whiskey'
    },
    {
        image: tequila,
        name: 'Tequila'
    },
    {
        image: brandy,
        name: 'Brandy'
    },
    {
        image: bourbon,
        name: 'Bourbon'
    },
    {
        image: gin,
        name: 'Gin'
    }
]

const getSearchUrl = (name: string) => {
    const searchParams = new URLSearchParams({
        search: name,
        type: 'alcoholic'
    })

    return `?${searchParams.toString()}`
}
</script>

<style lang="scss" scoped>
.az-welcome {
    z-index: 0;
    margin-block-end: -2px;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 36px 24px;

    @media (max-width: 767px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    @media (max-width: 480px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__tile {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 24px;
        cursor: pointer;
        text-decoration: none;

        &:focus-visible {
            @include focus-ring($color-grey-300, true);
        }

        &:hover {
            .az-welcome__name {
                color: $color-grey-300;
                text-shadow: 1px 1px $color-milk-400;
            }
        }
    }

    &__image {
        z-index: 1;
        max-width: 100%;
        max-height: 200px;
        display: block;
    }

    &__name {
        font-size: 15px;
        line-height: 1.25em;
        color: $color-milk-200;
        text-transform: uppercase;
    }
}
</style>