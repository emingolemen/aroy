import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { RecipeGrid } from '@/components/recipes/RecipeGrid'
import { RecipeFilters } from '@/components/recipes/RecipeFilters'
import { TagGroup } from '@/types/database'

async function getTagGroups() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tag_groups')
    .select(`
      *,
      tags (*)
    `)
    .order('display_order')
    .order('name', { foreignTable: 'tags' })

  if (error) {
    console.error('Error fetching tag groups:', error)
    return []
  }

  return data || []
}

async function getFavorites(filters?: {
  tagIds?: string[]
  search?: string
  tagGroups?: TagGroup[]
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      recipe:recipes (
        id,
        slug,
        name,
        image_url,
        recipe_tags (
          tag:tags (
            id,
            name,
            tag_group:tag_groups (
              id,
              name
            )
          )
        ),
        recipe_ingredients (
          tag:tags (
            id,
            name,
            tag_group:tag_groups (
              id,
              name
            )
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching favorites:', error)
    return []
  }

  let recipes = (data || []).map((fav: any) => ({
    ...fav.recipe,
    tags: fav.recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
    recipe_ingredients: fav.recipe.recipe_ingredients?.map((ri: any) => ri.tag) || [],
  }))

  // Apply search filter: search by recipe title, tags, and ingredient tags
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    recipes = recipes.filter((recipe: any) => {
      // Check recipe title
      const matchesTitle = recipe.name.toLowerCase().includes(searchLower)
      
      // Check tags
      const matchesTags = recipe.tags?.some((tag: any) => 
        tag.name.toLowerCase().includes(searchLower)
      ) || false
      
      // Check ingredient tags
      const matchesIngredientTags = recipe.recipe_ingredients?.some((tag: any) => 
        tag.name.toLowerCase().includes(searchLower)
      ) || false
      
      return matchesTitle || matchesTags || matchesIngredientTags
    })
  }

  // Filter by tags if provided
  if (filters?.tagIds && filters.tagIds.length > 0 && filters.tagGroups) {
    // Build a map of tag ID to tag group name
    const tagToGroupMap = new Map<string, string>()
    filters.tagGroups.forEach(group => {
      group.tags?.forEach((tag: any) => {
        tagToGroupMap.set(tag.id, group.name.toLowerCase())
      })
    })

    // Get all unique ingredient tag IDs from the database
    const { data: ingredientTagsData } = await supabase
      .from('recipe_ingredients')
      .select('tag_id')
    
    const ingredientTagIdSet = new Set<string>()
    ingredientTagsData?.forEach((item: any) => {
      ingredientTagIdSet.add(item.tag_id)
    })

    // Separate tags into recipe tags and ingredient tags
    const recipeTagIds: string[] = []
    const ingredientTagIds: string[] = []
    
    filters.tagIds.forEach(tagId => {
      const groupName = tagToGroupMap.get(tagId) || ''
      // A tag is an ingredient tag if:
      // 1. Its tag group name includes "ingredient" (case-insensitive), OR
      // 2. The tag is actually used in recipe_ingredients table
      const isIngredientGroup = groupName.includes('ingredient') || 
                                groupName.includes('protein') ||
                                groupName.includes('veggie') ||
                                groupName.includes('carb') ||
                                groupName.includes('dairy')
      
      if (isIngredientGroup || ingredientTagIdSet.has(tagId)) {
        ingredientTagIds.push(tagId)
      } else {
        recipeTagIds.push(tagId)
      }
    })

    recipes = recipes.filter((recipe: any) => {
      const recipeTagIdsInRecipe = recipe.tags?.map((tag: any) => tag.id) || []
      const ingredientTagIdsInRecipe = recipe.recipe_ingredients?.map((tag: any) => tag.id) || []

      // OR logic within recipe tags: recipe must have at least one of the selected recipe tags
      const matchesRecipeTags = recipeTagIds.length === 0 || 
        recipeTagIds.some(tagId => recipeTagIdsInRecipe.includes(tagId))

      // OR logic within ingredient tags: recipe must have at least one of the selected ingredient tags
      const matchesIngredientTags = ingredientTagIds.length === 0 || 
        ingredientTagIds.some(tagId => ingredientTagIdsInRecipe.includes(tagId))

      // AND logic between recipe tags and ingredient tags: recipe must match both groups
      return matchesRecipeTags && matchesIngredientTags
    })
  }

  return recipes
}

interface PageProps {
  searchParams: Promise<{
    tags?: string
    search?: string
  }>
}

export default async function FavoritesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tagIds = params.tags ? params.tags.split(',') : []
  const search = params.search || ''

  const [tagGroups] = await Promise.all([
    getTagGroups(),
  ])
  
  const recipes = await getFavorites({ tagIds, search, tagGroups: tagGroups as TagGroup[] })

  return (
    <div className="flex w-full">
      {/* Left Sidebar - Filters */}
      <aside className="w-64 px-4 py-6 border-r border-gray-200">
        <RecipeFilters tagGroups={tagGroups as TagGroup[]} initialTagIds={tagIds} initialSearch={search} basePath="/favorites" />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-6">
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No favorites found. Try adjusting your filters.</p>
          </div>
        ) : (
          <RecipeGrid>
            {recipes.map((recipe: any, index: number) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                priority={index < 3}
              />
            ))}
          </RecipeGrid>
        )}
      </div>
    </div>
  )
}

