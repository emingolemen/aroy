'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Recipe } from '@/types/database'

interface RecipeCardProps {
  recipe: Recipe & {
    tags?: Array<{ id: string; name: string; tag_group?: { name: string } }>
    recipe_ingredients?: Array<{ id: string; name: string }>
  }
  priority?: boolean
  basePath?: string
  useId?: boolean
}

export function RecipeCard({ recipe, priority = false, basePath = '/recipes/', useId = false }: RecipeCardProps) {
  // Get main tags (from tag groups like Cuisine, Type) - exclude Ingredients
  const mainTags = recipe.tags?.filter(tag => 
    tag.tag_group?.name !== 'Ingredients' && 
    tag.tag_group?.name !== 'Ingredient Categories'
  ) || []

  // Get ingredient keywords (main ingredients)
  const ingredients = recipe.recipe_ingredients || []

  const recipeHref = useId ? `${basePath}${recipe.id}` : `${basePath}${recipe.slug}`

  return (
    <div className="bg-white overflow-hidden flex flex-col gap-2.5">
      {recipe.image_url && (
        <Link href={recipeHref} className="block">
          <div className="relative w-full aspect-square overflow-hidden rounded-lg">
            <Image
              src={recipe.image_url}
              alt={recipe.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
          </div>
        </Link>
      )}
      <div className="flex flex-col gap-2">
        {/* Tags above title */}
        {mainTags.length > 0 && (
          <div className="flex flex-wrap text-xs leading-4 w-full gap-2">
            {mainTags.slice(0, 3).map(tag => (
              <Link
                key={tag.id}
                href={`/?tags=${tag.id}`}
                className="text-xs font-bold uppercase tracking-wide hover:underline transition-colors"
                style={{ color: 'rgba(230, 115, 0, 1)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
        
        {/* Title */}
        <Link href={recipeHref} className="group">
          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors leading-[26px] w-full h-auto">
            {recipe.name}
          </h3>
        </Link>
        
        {/* Keywords (main ingredients) */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 leading-4 h-auto w-full">
            {ingredients.slice(0, 4).map((ingredient, index) => (
              <Link
                key={ingredient.id || `ingredient-${index}`}
                href={`/?tags=${ingredient.id}`}
                className="text-sm text-gray-500 font-medium hover:text-gray-700 hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {ingredient.name}
              </Link>
            ))}
            {ingredients.length > 4 && (
              <span className="text-sm text-gray-500 font-medium">...</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

