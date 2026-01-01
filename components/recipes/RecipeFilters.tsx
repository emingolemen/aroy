'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TagGroup } from '@/types/database'

interface RecipeFiltersProps {
  tagGroups: TagGroup[]
  initialTagIds?: string[]
  initialSearch?: string
  basePath?: string
}

export function RecipeFilters({ tagGroups, initialTagIds = [], initialSearch = '', basePath = '/' }: RecipeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagIds)

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','))
    }
    router.push(`${basePath}?${params.toString()}`, { scroll: false })
  }, [selectedTags, router, basePath])

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  // Organize tag groups - check for hierarchy patterns
  // Common patterns: "Ingredients > Proteins", or separate groups like "Cuisine", "Type", "Ingredients"
  const allMainGroups = tagGroups.filter(g => 
    !g.name.toLowerCase().includes('ingredient') || 
    g.name.toLowerCase() === 'ingredients'
  )
  
  // Separate Cuisine to render at the end
  const cuisineGroup = allMainGroups.find(g => g.name.toLowerCase() === 'cuisine')
  // Separate Type to render at the very end (after Cuisine)
  const typeGroup = allMainGroups.find(g => g.name.toLowerCase() === 'type')
  const mainGroups = allMainGroups.filter(g => 
    g.name.toLowerCase() !== 'cuisine' && 
    g.name.toLowerCase() !== 'type'
  )
  
  const allIngredientGroups = tagGroups.filter(g => 
    g.name.toLowerCase().includes('ingredient') && 
    g.name.toLowerCase() !== 'ingredients'
  )
  
  // Reorder ingredient groups: move "Veg Protein" from index 3 to index 2 (0-indexed: from 3 to 2)
  const vegProteinGroup = allIngredientGroups.find(g => 
    g.name.toLowerCase().includes('veg') && g.name.toLowerCase().includes('protein')
  )
  const otherIngredientGroups = allIngredientGroups.filter(g => 
    !(g.name.toLowerCase().includes('veg') && g.name.toLowerCase().includes('protein'))
  )
  
  // Reconstruct ingredientGroups with Veg Protein at index 2 (3rd position)
  // This means: [item0, item1, Veg Protein, item2, item3, ...]
  const ingredientGroups = vegProteinGroup
    ? (() => {
        const result = [...otherIngredientGroups]
        // Insert Veg Protein at index 2 (3rd position)
        if (result.length >= 2) {
          result.splice(2, 0, vegProteinGroup)
        } else {
          // If fewer than 2 items, just prepend it
          result.unshift(vegProteinGroup)
        }
        return result
      })()
    : otherIngredientGroups

  return (
    <div className="space-y-8">
      {/* Main tag groups (excluding Cuisine) */}
      {mainGroups.map((group) => (
        <div key={group.id} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">{group.name}</h3>
          <div className="space-y-1">
            {(group.tags || []).map((tag: any) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`block text-sm text-left w-full hover:text-gray-900 transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Ingredients section with sub-groups */}
      {ingredientGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Ingredients</h3>
          {ingredientGroups.map((group) => (
            <div key={group.id} className="space-y-2 ml-4">
              <h4 className="text-sm font-semibold text-gray-700">{group.name.replace(/^.*>/, '').trim() || group.name}</h4>
              <div className="space-y-1">
                {(group.tags || []).map((tag: any) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`block text-sm text-left w-full hover:text-gray-900 transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Cuisine group rendered at the end */}
      {cuisineGroup && (
        <div key={cuisineGroup.id} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">{cuisineGroup.name}</h3>
          <div className="space-y-1">
            {(cuisineGroup.tags || []).map((tag: any) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`block text-sm text-left w-full hover:text-gray-900 transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Type group rendered at the very end */}
      {typeGroup && (
        <div key={typeGroup.id} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">{typeGroup.name}</h3>
          <div className="space-y-1">
            {(typeGroup.tags || []).map((tag: any) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`block text-sm text-left w-full hover:text-gray-900 transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

