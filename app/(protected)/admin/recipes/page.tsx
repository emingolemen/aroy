import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ClickableRecipeCard } from '@/components/recipes/ClickableRecipeCard'
import { RecipeGrid } from '@/components/recipes/RecipeGrid'
import { AdminRecipeFilters } from '@/components/admin/AdminRecipeFilters'
import { TagGroup } from '@/types/database'
import { Plus } from 'lucide-react'

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
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recipes:', error)
    return []
  }

  let filteredRecipes = (data || []).map((recipe: any) => ({
    ...recipe,
    tags: recipe.recipe_tags?.map((rt: any) => rt.tag) || [],
  }))

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
      
      // Check ingredient tags
      const matchesIngredientTags = recipe.recipe_ingredients?.some((ri: any) => 
        ri.tag.name.toLowerCase().includes(searchLower)
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

    return (data || []).filter((recipe: any) => {
      const recipeTagIdsInRecipe = recipe.recipe_tags?.map((rt: any) => rt.tag.id) || []
      const ingredientTagIdsInRecipe = recipe.recipe_ingredients?.map((ri: any) => ri.tag.id) || []

      const matchesRecipeTags = recipeTagIds.length === 0 || 
        recipeTagIds.some(tagId => recipeTagIdsInRecipe.includes(tagId))

      const matchesIngredientTags = ingredientTagIds.length === 0 || 
        ingredientTagIds.some(tagId => ingredientTagIdsInRecipe.includes(tagId))

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

export default async function AdminRecipesPage({ searchParams }: PageProps) {
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Manage Recipes</h1>
          </div>
          <Link href="/admin/recipes/new">
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </Link>
        </div>
        <AdminRecipeFilters tagGroups={tagGroups as TagGroup[]} initialTagIds={tagIds} initialSearch={search} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-6">
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No recipes found. Try adjusting your filters.</p>
            <Link href="/admin/recipes/new">
              <Button>Create Your First Recipe</Button>
            </Link>
          </div>
        ) : (
          <RecipeGrid>
            {recipes.map((recipe: any, index: number) => (
              <div key={recipe.id} className="relative">
                <ClickableRecipeCard 
                  recipe={recipe} 
                  priority={index < 3}
                  href={`/admin/recipes/${recipe.id}`}
                />
              </div>
            ))}
          </RecipeGrid>
        )}
      </div>
    </div>
  )
}

