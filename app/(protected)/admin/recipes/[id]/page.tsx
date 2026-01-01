import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/utils'
import { RecipeForm } from '@/components/admin/RecipeForm'
import { DeleteRecipeButton } from '@/components/admin/DeleteRecipeButton'

async function getRecipe(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_tags (
        tag:tags (
          id,
          name,
          tag_group_id
        )
      ),
      recipe_ingredients (
        tag:tags (
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    tagIds: data.recipe_tags?.map((rt: any) => rt.tag.id) || [],
    ingredientTagIds: data.recipe_ingredients?.map((ri: any) => ri.tag.id) || [],
  }
}

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('contributor')
  const { id } = await params
  
  const recipe = await getRecipe(id)

  if (!recipe) {
    notFound()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Edit Recipe</h1>
        <DeleteRecipeButton recipeId={recipe.id} />
      </div>
      <RecipeForm recipe={recipe} />
    </div>
  )
}

