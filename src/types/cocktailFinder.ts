export type PlaceholderColor = 'mint' | 'navy' | 'rose'

export type SearchType = 'alcoholic' | 'ingredient' | 'non-alcoholic'

export interface SearchTypeOption {
    label: string
    value: SearchType
}

export interface CocktailIngredient {
    ingredient: string
    measure: string | null
}

export interface Cocktail {
    alcoholic: string
    category: string
    id: string
    image: string | null
    placeholderColor: PlaceholderColor
    title: string
}

export interface CocktailDetails extends Cocktail {
    glass: string
    ibaClassification: string | null
    ingredients: CocktailIngredient[]
    instructions: string
    tags: string[]
}

export interface CocktailDbSearchResultApi {
    idDrink: string
    strAlcoholic?: string | null
    strCategory?: string | null
    strDrink: string
    strDrinkThumb?: string | null
}

export interface CocktailDbDetailsApi extends CocktailDbSearchResultApi {
    strAlcoholic: string | null
    strCategory: string | null
    strGlass?: string | null
    strIBA?: string | null
    strInstructions?: string | null
    strTags?: string | null
    strIngredient1?: string | null
    strIngredient2?: string | null
    strIngredient3?: string | null
    strIngredient4?: string | null
    strIngredient5?: string | null
    strIngredient6?: string | null
    strIngredient7?: string | null
    strIngredient8?: string | null
    strIngredient9?: string | null
    strIngredient10?: string | null
    strIngredient11?: string | null
    strIngredient12?: string | null
    strIngredient13?: string | null
    strIngredient14?: string | null
    strIngredient15?: string | null
    strMeasure1?: string | null
    strMeasure2?: string | null
    strMeasure3?: string | null
    strMeasure4?: string | null
    strMeasure5?: string | null
    strMeasure6?: string | null
    strMeasure7?: string | null
    strMeasure8?: string | null
    strMeasure9?: string | null
    strMeasure10?: string | null
    strMeasure11?: string | null
    strMeasure12?: string | null
    strMeasure13?: string | null
    strMeasure14?: string | null
    strMeasure15?: string | null
}

export interface CocktailDbSearchApi {
    drinks: CocktailDbSearchResultApi[] | null | string
}

export interface CocktailDbDetailsResponseApi extends CocktailDbSearchApi {
    drinks: CocktailDbDetailsApi[] | null | string
}

export type ThumbVariant = 'card' | 'details'

export interface CocktailUrlState {
    id: string
    title: string
}

export interface CocktailSearchUrlState {
    query: string
    type: SearchType
}

export interface WelcomeItem {
    image: string
    name: string
}

export interface CocktailAlternativeResults {
    drinks: CocktailDbSearchResultApi[]
    query: string
    type: SearchType
}