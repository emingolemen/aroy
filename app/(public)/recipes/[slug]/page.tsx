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
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  // Fetch tag information for structured ingredients
  let tagMap = new Map<string, any>()
  if (data.ingredients_structured && Array.isArray(data.ingredients_structured)) {
    const structuredTagIds = data.ingredients_structured
      .map((ing: any) => ing.tagId)
      .filter((id: string | null): id is string => id !== null)
    
    if (structuredTagIds.length > 0) {
      const { data: tagsData } = await supabase
        .from('tags')
        .select('id, name')
        .in('id', structuredTagIds)
      
      if (tagsData) {
        tagsData.forEach((tag: any) => {
          tagMap.set(tag.id, tag)
        })
      }
    }
  }

  return {
    ...data,
    tags: data.recipe_tags?.map((rt: any) => rt.tag) || [],
    tagMap,
  }
}

function formatStructuredIngredientsToTiptapJSON(
  ingredients_structured: any[] | null | undefined,
  tagMap: Map<string, any>
): string {
  if (!ingredients_structured || !Array.isArray(ingredients_structured) || ingredients_structured.length === 0) {
    return '{"type":"doc","content":[]}'
  }

  // Format each ingredient row as a line: "quantity tagName notes"
  const lines = ingredients_structured.map((ing: any) => {
    const parts: string[] = []
    
    // Add quantity if present
    if (ing.quantity && ing.quantity.trim()) {
      parts.push(ing.quantity.trim())
    }
    
    // Add tag name if tagId exists
    if (ing.tagId && tagMap.has(ing.tagId)) {
      parts.push(tagMap.get(ing.tagId).name)
    }
    
    // Add notes if present
    if (ing.notes && ing.notes.trim()) {
      parts.push(ing.notes.trim())
    }
    
    return parts.join(' ')
  }).filter((line: string) => line.trim())

  // Convert lines to Tiptap JSON format (one paragraph per line)
  const paragraphs = lines.map((line: string) => ({
    type: 'paragraph',
    content: [{ type: 'text', text: line }]
  }))

  return JSON.stringify({
    type: 'doc',
    content: paragraphs.length > 0 ? paragraphs : [{
      type: 'paragraph',
      content: []
    }]
  })
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
    <div className="flex w-full">
      <div className="flex-1 px-4 py-6">
        <div className="grid grid-cols-[1fr_2fr] gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Image */}
            {recipe.image_url && (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <Image
                  src={recipe.image_url}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Ingredients */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Ingredients</h2>
              <div className="text-gray-700">
                {recipe.ingredients_structured && Array.isArray(recipe.ingredients_structured) && recipe.ingredients_structured.length > 0 ? (
                  <RichTextRenderer content={formatStructuredIngredientsToTiptapJSON(recipe.ingredients_structured, recipe.tagMap)} />
                ) : (
                  <RichTextRenderer content={recipe.ingredients_text} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8">
            {/* Title and Buttons - matches image height using aspect ratio */}
            <div className="flex flex-col gap-0 w-full aspect-[2/1]">
              {user && (
                <div className="flex gap-2 mb-3">
                  <FavoriteButton recipeId={recipe.id} />
                  <AddToCalendarButton recipeId={recipe.id} recipeName={recipe.name} />
                </div>
              )}

              {/* Tags above title */}
              {mainTags.length > 0 && (
                <div className="flex flex-wrap text-xs leading-4 w-full gap-2">
                  {mainTags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: 'rgba(230, 115, 0, 1)' }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              
              <h1 className="text-4xl font-bold text-gray-900">{recipe.name}</h1>

              {/* Inspiration */}
              {recipe.inspiration && (
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">Inspiration</h2>
                  <div className="text-gray-700">
                    <RichTextRenderer content={recipe.inspiration} />
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Instructions</h2>
              <div className="text-gray-700">
                <RichTextRenderer content={recipe.instructions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

