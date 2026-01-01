import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RichTextRenderer } from '@/components/editor/RichTextRenderer'
import { FavoriteButton } from '@/components/recipes/FavoriteButton'
import { AddToCalendarButton } from '@/components/recipes/AddToCalendarButton'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { getUser } from '@/lib/auth/utils'

async function getRecipe(slug: string) {
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
          name
        )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    tags: data.recipe_tags?.map((rt: any) => rt.tag) || [],
    recipe_ingredients: data.recipe_ingredients?.map((ri: any) => ri.tag) || [],
  }
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const recipe = await getRecipe(slug)
  const user = await getUser()

  if (!recipe) {
    notFound()
  }

  // Separate main tags (Cuisine, Type) from ingredient tags
  const mainTags = recipe.tags?.filter((tag: any) => 
    tag.tag_group?.name !== 'Ingredients' && 
    tag.tag_group?.name !== 'Ingredient Categories'
  ) || []

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <div className="mb-8">
        {/* Tags above title */}
        {mainTags.length > 0 && (
          <div className="mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700">
              {mainTags.map((tag: any) => tag.name).join(' ')}
            </span>
          </div>
        )}
        
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{recipe.name}</h1>

        {user && (
          <div className="flex gap-2 mb-8">
            <FavoriteButton recipeId={recipe.id} />
            <AddToCalendarButton recipeId={recipe.id} recipeName={recipe.name} />
          </div>
        )}
      </div>

      {recipe.image_url && (
        <div className="relative w-full aspect-[4/3] mb-10 rounded-lg overflow-hidden">
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="space-y-10">
        {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Main Ingredients</h2>
            <div className="flex flex-wrap gap-2">
              {recipe.recipe_ingredients.map((ingredient: any) => (
                <span
                  key={ingredient.id}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                >
                  {ingredient.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Ingredients</h2>
          <div className="text-gray-700">
            <RichTextRenderer content={recipe.ingredients_text} />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Instructions</h2>
          <div className="text-gray-700">
            <RichTextRenderer content={recipe.instructions} />
          </div>
        </div>

        {recipe.inspiration && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Inspiration</h2>
            <div className="text-gray-700">
              <RichTextRenderer content={recipe.inspiration} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

