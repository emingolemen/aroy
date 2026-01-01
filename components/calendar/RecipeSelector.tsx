'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Recipe } from '@/types/database'
import Image from 'next/image'

interface RecipeSelectorProps {
  onSelect: (recipe: Recipe) => void
  initialRecipeId?: string
}

export function RecipeSelector({ onSelect, initialRecipeId }: RecipeSelectorProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecipes()
  }, [])

  useEffect(() => {
    if (initialRecipeId) {
      loadRecipe(initialRecipeId)
    }
  }, [initialRecipeId])

  const loadRecipes = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('name')
      .limit(50)

    if (error) {
      console.error('Error loading recipes:', error)
    } else {
      setRecipes(data || [])
    }
    setLoading(false)
  }

  const loadRecipe = async (id: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      // Pre-select the recipe in the list (don't auto-submit)
      // The user still needs to select meal type and click Save
      setSearch(data.name)
      // Also call onSelect to set the recipe ID in parent component
      onSelect(data)
    }
  }

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-60 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No recipes found</div>
        ) : (
          filteredRecipes.map((recipe) => (
            <Button
              key={recipe.id}
              variant="outline"
              className="w-full justify-start h-auto p-3"
              onClick={() => onSelect(recipe)}
            >
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="w-12 h-12 object-cover rounded mr-3"
                />
              )}
              <span className="text-left">{recipe.name}</span>
            </Button>
          ))
        )}
      </div>
    </div>
  )
}

