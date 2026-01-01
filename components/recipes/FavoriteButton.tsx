'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  recipeId: string
}

export function FavoriteButton({ recipeId }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkFavorite()
  }, [recipeId])

  const checkFavorite = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)
      .single()

    setIsFavorite(!!data)
    setLoading(false)
  }

  const toggleFavorite = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return
    }

    if (isFavorite) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
      setIsFavorite(false)
    } else {
      await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          recipe_id: recipeId,
        })
      setIsFavorite(true)
    }
  }

  if (loading) {
    return <Button variant="outline" disabled>Loading...</Button>
  }

  return (
    <Button
      variant={isFavorite ? 'default' : 'outline'}
      onClick={toggleFavorite}
    >
      <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
      {isFavorite ? 'Favorited' : 'Add to Favorites'}
    </Button>
  )
}

