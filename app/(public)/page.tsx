import { createClient } from '@/lib/supabase/server'
import { RecipeFilters } from '@/components/recipes/RecipeFilters'
import { RecipeGrid } from '@/components/recipes/RecipeGrid'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Tag, TagGroup } from '@/types/database'
import Image from 'next/image'

async function getRecipes(filters?: {
  tagIds?: string[]
  search?: string
  tagGroups?: TagGroup[]
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_tags (
        tag:tags (
          id,
          name,
          tag_group:tag_groups (
            id,
            name
          )
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recipes:', error)
    return []
  }

  let filteredRecipes = data || []

  // Extract tagIds from structured ingredients and fetch tags
  const structuredTagIds = new Set<string>()
  filteredRecipes.forEach((recipe: any) => {
    if (recipe.ingredients_structured && Array.isArray(recipe.ingredients_structured)) {
      recipe.ingredients_structured.forEach((ing: any) => {
        if (ing.tagId) {
          structuredTagIds.add(ing.tagId)
        }
      })
    }
  })

  // Fetch tags for structured ingredients
  const tagMap = new Map<string, Tag>()
  if (structuredTagIds.size > 0) {
    const { data: tagsData } = await supabase
      .from('tags')
      .select(`
        id,
        name,
        tag_group:tag_groups (
          id,
          name
        )
      `)
      .in('id', Array.from(structuredTagIds))

    if (tagsData) {
      tagsData.forEach((tag: any) => {
        tagMap.set(tag.id, tag)
      })
    }
  }

  // Map structured ingredient tags to each recipe
  filteredRecipes = filteredRecipes.map((recipe: any) => {
    const structuredIngredientTags: Tag[] = []
    if (recipe.ingredients_structured && Array.isArray(recipe.ingredients_structured)) {
      const seenTagIds = new Set<string>()
      recipe.ingredients_structured.forEach((ing: any) => {
        if (ing.tagId && tagMap.has(ing.tagId) && !seenTagIds.has(ing.tagId)) {
          structuredIngredientTags.push(tagMap.get(ing.tagId)!)
          seenTagIds.add(ing.tagId)
        }
      })
    }
    return {
      ...recipe,
      structured_ingredient_tags: structuredIngredientTags
    }
  })

  // Apply search filter: search by recipe title, tags, and ingredient tags
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filteredRecipes = filteredRecipes.filter((recipe: any) => {
      // Check recipe title
      const matchesTitle = recipe.name.toLowerCase().includes(searchLower)
      
      // Check tags
      const matchesTags = recipe.recipe_tags?.some((rt: any) => 
        rt.tag.name.toLowerCase().includes(searchLower)
      ) || false
      
      // Check ingredient tags (from structured ingredients)
      const matchesIngredientTags = recipe.structured_ingredient_tags?.some((tag: any) => 
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

    // Get all unique ingredient tag IDs from structured ingredients
    const structuredIngredientTagIdSet = new Set<string>()
    filteredRecipes.forEach((recipe: any) => {
      if (recipe.ingredients_structured && Array.isArray(recipe.ingredients_structured)) {
        recipe.ingredients_structured.forEach((ing: any) => {
          if (ing.tagId) {
            structuredIngredientTagIdSet.add(ing.tagId)
          }
        })
      }
    })

    // Separate tags into recipe tags and ingredient tags
    const recipeTagIds: string[] = []
    const ingredientTagIds: string[] = []
    
    filters.tagIds.forEach(tagId => {
      const groupName = tagToGroupMap.get(tagId) || ''
      // A tag is an ingredient tag if:
      // 1. Its tag group name includes "ingredient" (case-insensitive), OR
      // 2. The tag is actually used in structured ingredients
      const isIngredientGroup = groupName.includes('ingredient') || 
                                groupName.includes('protein') ||
                                groupName.includes('veggie') ||
                                groupName.includes('carb') ||
                                groupName.includes('dairy')
      
      if (isIngredientGroup || structuredIngredientTagIdSet.has(tagId)) {
        ingredientTagIds.push(tagId)
      } else {
        recipeTagIds.push(tagId)
      }
    })

    return filteredRecipes.filter((recipe: any) => {
      const recipeTagIdsInRecipe = recipe.recipe_tags?.map((rt: any) => rt.tag.id) || []
      const ingredientTagIdsInRecipe = recipe.structured_ingredient_tags?.map((tag: any) => tag.id) || []

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

  return filteredRecipes
}

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

interface PageProps {
  searchParams: Promise<{
    tags?: string
    search?: string
  }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const tagIds = params.tags ? params.tags.split(',') : []
  const search = params.search || ''

  const [tagGroups] = await Promise.all([
    getTagGroups(),
  ])
  
  const recipes = await getRecipes({ tagIds, search, tagGroups: tagGroups as TagGroup[] })

  return (
    <div className="flex w-full">
      {/* Left Sidebar - Filters */}
      <aside className="w-64 px-4 py-6 border-r border-gray-200">
        <RecipeFilters tagGroups={tagGroups as TagGroup[]} initialTagIds={tagIds} initialSearch={search} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-6">
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No recipes found. Try adjusting your filters.</p>
          </div>
        ) : (
          <RecipeGrid>
            {recipes.map((recipe: any, index: number) => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  ...recipe,
                  tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
                  recipe_ingredients: recipe.structured_ingredient_tags || [],
                }}
                priority={index < 3}
              />
            ))}
          </RecipeGrid>
        )}
      </div>
    </div>
  )
}

