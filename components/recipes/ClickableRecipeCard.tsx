'use client'

import { useRouter } from 'next/navigation'
import { RecipeCard } from './RecipeCard'
import { Recipe } from '@/types/database'

interface ClickableRecipeCardProps {
  recipe: Recipe & {
    tags?: Array<{ id: string; name: string; tag_group?: { name: string } }>
    recipe_ingredients?: Array<{ id: string; name: string }>
  }
  priority?: boolean
  href: string
}

export function ClickableRecipeCard({ recipe, priority, href }: ClickableRecipeCardProps) {
  const router = useRouter()

  return (
    <div 
      onClick={() => router.push(href)}
      className="cursor-pointer"
    >
      <RecipeCard recipe={recipe} priority={priority} />
    </div>
  )
}

