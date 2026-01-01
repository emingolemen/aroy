export type UserRole = 'viewer' | 'contributor' | 'admin'
export type MealType = 'breakfast' | 'lunch' | 'dinner'

export interface TagGroup {
  id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
  tags?: Tag[]
}

export interface Tag {
  id: string
  tag_group_id: string
  name: string
  created_at: string
  updated_at: string
  tag_group?: TagGroup
}

export interface IngredientRow {
  quantity: string
  tagId: string | null
  notes: string
}

export interface Recipe {
  id: string
  slug: string
  name: string
  image_url: string | null
  ingredients_text: string // JSON string of Tiptap content
  ingredients_structured?: IngredientRow[] // Structured ingredient data
  instructions: string // JSON string of Tiptap content
  inspiration: string // JSON string of Tiptap content
  created_at: string
  updated_at: string
  created_by: string | null
  tags?: Tag[]
  recipe_ingredients?: Tag[]
}

export interface RecipeTag {
  recipe_id: string
  tag_id: string
}

export interface RecipeIngredient {
  recipe_id: string
  tag_id: string
}

export interface UserFavorite {
  user_id: string
  recipe_id: string
  created_at: string
}

export interface CalendarEntry {
  id: string
  user_id: string
  recipe_id: string
  date: string
  meal_type: MealType
  notes: string | null
  created_at: string
  updated_at: string
  recipe?: Recipe
}

