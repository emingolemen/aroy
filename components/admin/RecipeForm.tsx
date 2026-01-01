'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { TagSelector } from '@/components/admin/TagSelector'
import { Tag } from '@/types/database'
import { Upload } from 'lucide-react'

const recipeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  image_url: z.string().optional(),
  ingredients_text: z.string(),
  instructions: z.string(),
  inspiration: z.string(),
  tagIds: z.array(z.string()),
  ingredientTagIds: z.array(z.string()),
})

type RecipeFormData = z.infer<typeof recipeSchema>

interface RecipeFormProps {
  recipe?: {
    id: string
    name: string
    slug: string
    image_url: string | null
    ingredients_text: string
    instructions: string
    inspiration: string
    tagIds?: string[]
    ingredientTagIds?: string[]
  }
}

export function RecipeForm({ recipe }: RecipeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tagGroups, setTagGroups] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: recipe?.name || '',
      slug: recipe?.slug || '',
      image_url: recipe?.image_url || '',
      ingredients_text: recipe?.ingredients_text || '{"type":"doc","content":[]}',
      instructions: recipe?.instructions || '{"type":"doc","content":[]}',
      inspiration: recipe?.inspiration || '{"type":"doc","content":[]}',
      tagIds: recipe?.tagIds || [],
      ingredientTagIds: recipe?.ingredientTagIds || [],
    },
  })

  useEffect(() => {
    loadTagGroups()
  }, [])

  const loadTagGroups = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tag_groups')
      .select(`
        *,
        tags (*)
      `)
      .order('display_order')
      .order('name', { foreignTable: 'tags' })
    
    if (data) {
      setTagGroups(data)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name}`

    const { data: uploadData, error } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName)

    setValue('image_url', publicUrl)
    setUploading(false)
  }

  const onSubmit = async (data: RecipeFormData) => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    try {
      if (recipe) {
        // Update existing recipe
        const { error: recipeError } = await supabase
          .from('recipes')
          .update({
            name: data.name,
            slug: data.slug,
            image_url: data.image_url || null,
            ingredients_text: data.ingredients_text,
            instructions: data.instructions,
            inspiration: data.inspiration,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipe.id)

        if (recipeError) throw recipeError

        // Update tags
        await supabase.from('recipe_tags').delete().eq('recipe_id', recipe.id)
        if (data.tagIds.length > 0) {
          await supabase.from('recipe_tags').insert(
            data.tagIds.map(tagId => ({
              recipe_id: recipe.id,
              tag_id: tagId,
            }))
          )
        }

        // Update ingredients
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipe.id)
        if (data.ingredientTagIds.length > 0) {
          await supabase.from('recipe_ingredients').insert(
            data.ingredientTagIds.map(tagId => ({
              recipe_id: recipe.id,
              tag_id: tagId,
            }))
          )
        }
      } else {
        // Create new recipe
        const { data: newRecipe, error: recipeError } = await supabase
          .from('recipes')
          .insert({
            name: data.name,
            slug: data.slug,
            image_url: data.image_url || null,
            ingredients_text: data.ingredients_text,
            instructions: data.instructions,
            inspiration: data.inspiration,
            created_by: user.id,
          })
          .select()
          .single()

        if (recipeError) throw recipeError

        // Add tags
        if (data.tagIds.length > 0) {
          await supabase.from('recipe_tags').insert(
            data.tagIds.map(tagId => ({
              recipe_id: newRecipe.id,
              tag_id: tagId,
            }))
          )
        }

        // Add ingredients
        if (data.ingredientTagIds.length > 0) {
          await supabase.from('recipe_ingredients').insert(
            data.ingredientTagIds.map(tagId => ({
              recipe_id: newRecipe.id,
              tag_id: tagId,
            }))
          )
        }
      }

      router.push('/admin/recipes')
      router.refresh()
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Error saving recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Recipe Name</Label>
          <Input
            id="name"
            {...register('name')}
            onChange={(e) => {
              register('name').onChange(e)
              if (!recipe) {
                setValue('slug', generateSlug(e.target.value))
              }
            }}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register('slug')} />
          {errors.slug && (
            <p className="text-sm text-red-600">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <div className="flex items-center gap-4">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          {watch('image_url') && (
            <img
              src={watch('image_url')!}
              alt="Preview"
              className="h-20 w-20 object-cover rounded"
            />
          )}
        </div>
        {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
        <Input
          type="hidden"
          {...register('image_url')}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagSelector
          tagGroups={tagGroups.filter(g => 
            g.name.toLowerCase() === 'cuisine' || 
            g.name.toLowerCase() === 'type'
          )}
          selectedTagIds={watch('tagIds')}
          onChange={(tagIds) => setValue('tagIds', tagIds)}
        />
      </div>

      <div className="space-y-2">
        <Label>Main Ingredients (from ingredient tags)</Label>
        <TagSelector
          tagGroups={tagGroups.filter(g => 
            g.name.toLowerCase().includes('ingredient') || 
            g.name.toLowerCase().includes('protein') ||
            g.name.toLowerCase().includes('veggie') ||
            g.name.toLowerCase().includes('carb') ||
            g.name.toLowerCase().includes('dairy')
          )}
          selectedTagIds={watch('ingredientTagIds')}
          onChange={(tagIds) => setValue('ingredientTagIds', tagIds)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients_text">Ingredients (Rich Text)</Label>
        <RichTextEditor
          content={watch('ingredients_text')}
          onChange={(content) => setValue('ingredients_text', content)}
          placeholder="List all ingredients..."
        />
        {errors.ingredients_text && (
          <p className="text-sm text-red-600">{errors.ingredients_text.message}</p>
        )}
        <Input
          type="hidden"
          {...register('ingredients_text')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions (Rich Text)</Label>
        <RichTextEditor
          content={watch('instructions')}
          onChange={(content) => setValue('instructions', content)}
          placeholder="Write step-by-step instructions..."
        />
        {errors.instructions && (
          <p className="text-sm text-red-600">{errors.instructions.message}</p>
        )}
        <Input
          type="hidden"
          {...register('instructions')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inspiration">Inspiration (Rich Text)</Label>
        <RichTextEditor
          content={watch('inspiration')}
          onChange={(content) => setValue('inspiration', content)}
          placeholder="Add links and credits to recipes that inspired this one..."
        />
        {errors.inspiration && (
          <p className="text-sm text-red-600">{errors.inspiration.message}</p>
        )}
        <Input
          type="hidden"
          {...register('inspiration')}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading || uploading}>
          {loading ? 'Saving...' : recipe ? 'Update Recipe' : 'Create Recipe'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

