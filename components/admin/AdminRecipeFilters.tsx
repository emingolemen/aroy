'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TagGroup } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

const tagGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  display_order: z.number().min(0).default(0),
})

type TagFormData = z.infer<typeof tagSchema>
type TagGroupFormData = z.infer<typeof tagGroupSchema>

interface AdminRecipeFiltersProps {
  tagGroups: TagGroup[]
  initialTagIds?: string[]
  initialSearch?: string
  basePath?: string
}

export function AdminRecipeFilters({ tagGroups: initialTagGroups, initialTagIds = [], initialSearch = '', basePath = '/admin/recipes' }: AdminRecipeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagIds)
  const [tagGroups, setTagGroups] = useState<TagGroup[]>(initialTagGroups)
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; groupId: string } | null>(null)
  const [editingTagGroup, setEditingTagGroup] = useState<{ id: string; name: string; display_order: number } | null>(null)

  useEffect(() => {
    setTagGroups(initialTagGroups)
  }, [initialTagGroups])

  useEffect(() => {
    setSelectedTags(initialTagIds)
  }, [initialTagIds])

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

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      console.error('Error deleting tag:', error)
      alert('Error deleting tag. Please try again.')
    } else {
      router.refresh()
    }
  }

  const handleUpdateTag = async (data: TagFormData) => {
    if (!editingTag) return

    const supabase = createClient()
    const { error } = await supabase
      .from('tags')
      .update({ name: data.name })
      .eq('id', editingTag.id)

    if (error) {
      console.error('Error updating tag:', error)
      alert('Error updating tag. Please try again.')
    } else {
      setEditingTag(null)
      router.refresh()
    }
  }

  const handleCreateTag = async (data: TagFormData, tagGroupId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('tags')
      .insert({
        tag_group_id: tagGroupId,
        name: data.name,
      })

    if (error) {
      console.error('Error creating tag:', error)
      alert('Error creating tag. Please try again.')
    } else {
      router.refresh()
    }
  }

  const handleCreateTagGroup = async (data: TagGroupFormData) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('tag_groups')
      .insert({
        name: data.name,
        display_order: data.display_order,
      })

    if (error) {
      console.error('Error creating tag group:', error)
      alert('Error creating tag group. Please try again.')
    } else {
      router.refresh()
    }
  }

  const handleUpdateTagGroup = async (data: TagGroupFormData) => {
    if (!editingTagGroup) return

    const supabase = createClient()
    const { error } = await supabase
      .from('tag_groups')
      .update({
        name: data.name,
        display_order: data.display_order,
      })
      .eq('id', editingTagGroup.id)

    if (error) {
      console.error('Error updating tag group:', error)
      alert('Error updating tag group. Please try again.')
    } else {
      setEditingTagGroup(null)
      router.refresh()
    }
  }

  const handleDeleteTagGroup = async (tagGroupId: string) => {
    if (!confirm('Are you sure you want to delete this tag group? This will also delete all tags in this group.')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('tag_groups')
      .delete()
      .eq('id', tagGroupId)

    if (error) {
      console.error('Error deleting tag group:', error)
      alert('Error deleting tag group. Please try again.')
    } else {
      router.refresh()
    }
  }

  // Organize tag groups - same logic as RecipeFilters
  const allMainGroups = tagGroups.filter(g => 
    !g.name.toLowerCase().includes('ingredient') || 
    g.name.toLowerCase() === 'ingredients'
  )
  
  const cuisineGroup = allMainGroups.find(g => g.name.toLowerCase() === 'cuisine')
  const typeGroup = allMainGroups.find(g => g.name.toLowerCase() === 'type')
  const mainGroups = allMainGroups.filter(g => 
    g.name.toLowerCase() !== 'cuisine' && 
    g.name.toLowerCase() !== 'type'
  )
  
  const allIngredientGroups = tagGroups.filter(g => 
    g.name.toLowerCase().includes('ingredient') && 
    g.name.toLowerCase() !== 'ingredients'
  )
  
  const vegProteinGroup = allIngredientGroups.find(g => 
    g.name.toLowerCase().includes('veg') && g.name.toLowerCase().includes('protein')
  )
  const otherIngredientGroups = allIngredientGroups.filter(g => 
    !(g.name.toLowerCase().includes('veg') && g.name.toLowerCase().includes('protein'))
  )
  
  const ingredientGroups = vegProteinGroup
    ? (() => {
        const result = [...otherIngredientGroups]
        if (result.length >= 2) {
          result.splice(2, 0, vegProteinGroup)
        } else {
          result.unshift(vegProteinGroup)
        }
        return result
      })()
    : otherIngredientGroups

  const renderTagGroup = (group: TagGroup, isIngredientSubGroup = false) => {
    const TagEditForm = ({ tag }: { tag: any }) => {
      const { register, handleSubmit, formState: { errors } } = useForm<TagFormData>({
        resolver: zodResolver(tagSchema),
        defaultValues: { name: tag.name },
      })

      return (
        <form onSubmit={handleSubmit((data) => handleUpdateTag(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`tag-name-${tag.id}`}>Tag Name</Label>
            <Input id={`tag-name-${tag.id}`} {...register('name')} />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">Save</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingTag(null)}>Cancel</Button>
          </div>
        </form>
      )
    }

    const TagCreateForm = ({ tagGroupId }: { tagGroupId: string }) => {
      const { register, handleSubmit, formState: { errors }, reset } = useForm<TagFormData>({
        resolver: zodResolver(tagSchema),
      })

      const onSubmit = async (data: TagFormData) => {
        await handleCreateTag(data, tagGroupId)
        reset()
      }

      return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`new-tag-${tagGroupId}`}>Tag Name</Label>
            <Input id={`new-tag-${tagGroupId}`} {...register('name')} />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <Button type="submit" size="sm" className="w-full">Add Tag</Button>
        </form>
      )
    }

    const TagGroupEditForm = () => {
      const { register, handleSubmit, formState: { errors } } = useForm<TagGroupFormData>({
        resolver: zodResolver(tagGroupSchema),
        defaultValues: {
          name: group.name,
          display_order: group.display_order || 0,
        },
      })

      return (
        <form onSubmit={handleSubmit((data) => handleUpdateTagGroup(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`group-name-${group.id}`}>Tag Group Name</Label>
            <Input id={`group-name-${group.id}`} {...register('name')} />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`group-order-${group.id}`}>Display Order</Label>
            <Input
              id={`group-order-${group.id}`}
              type="number"
              {...register('display_order', { valueAsNumber: true })}
            />
            {errors.display_order && (
              <p className="text-sm text-red-600">{errors.display_order.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">Save</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingTagGroup(null)}>Cancel</Button>
          </div>
        </form>
      )
    }

    return (
      <div key={group.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isIngredientSubGroup ? 'text-gray-700' : 'text-gray-900'}`}>
            {isIngredientSubGroup ? group.name.replace(/^.*>/, '').trim() || group.name : group.name}
          </h3>
          <div className="flex items-center gap-1">
            {editingTagGroup?.id === group.id ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTagGroup(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTagGroup({ id: group.id, name: group.name, display_order: group.display_order || 0 })}
                  className="h-6 w-6 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTagGroup(group.id)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        {editingTagGroup?.id === group.id ? (
          <TagGroupEditForm />
        ) : (
          <>
            <div className="space-y-1">
              {(group.tags || []).map((tag: any) => (
                <div key={tag.id} className="flex items-center gap-1 group">
                  {editingTag?.id === tag.id ? (
                    <div className="flex-1">
                      <TagEditForm tag={tag} />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleTag(tag.id)}
                        className={`flex-1 text-sm text-left hover:text-gray-900 transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-600'
                        }`}
                      >
                        {tag.name}
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTag({ id: tag.id, name: tag.name, groupId: group.id })}
                          className="h-5 w-5 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag.id)}
                          className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-gray-500 hover:text-gray-700">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tag to {group.name}</DialogTitle>
                  <DialogDescription>
                    Create a new tag in this category.
                  </DialogDescription>
                </DialogHeader>
                <TagCreateForm tagGroupId={group.id} />
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    )
  }

  const TagGroupCreateForm = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<TagGroupFormData>({
      resolver: zodResolver(tagGroupSchema),
      defaultValues: {
        display_order: 0,
      },
    })

    const onSubmit = async (data: TagGroupFormData) => {
      await handleCreateTagGroup(data)
      reset()
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-group-name">Tag Group Name</Label>
          <Input id="new-group-name" {...register('name')} />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-group-order">Display Order</Label>
          <Input
            id="new-group-order"
            type="number"
            {...register('display_order', { valueAsNumber: true })}
          />
          {errors.display_order && (
            <p className="text-sm text-red-600">{errors.display_order.message}</p>
          )}
        </div>
        <Button type="submit" size="sm" className="w-full">Create Tag Group</Button>
      </form>
    )
  }

  return (
    <div className="space-y-8">
      {/* Main tag groups (excluding Cuisine) */}
      {mainGroups.map((group) => renderTagGroup(group))}

      {/* Ingredients section with sub-groups */}
      {ingredientGroups.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Ingredients</h3>
          {ingredientGroups.map((group) => renderTagGroup(group, true))}
        </div>
      )}
      
      {/* Cuisine group rendered at the end */}
      {cuisineGroup && renderTagGroup(cuisineGroup)}
      
      {/* Type group rendered at the very end */}
      {typeGroup && renderTagGroup(typeGroup)}

      {/* Add New Tag Group */}
      <div className="pt-4 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Tag Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag Category</DialogTitle>
              <DialogDescription>
                Create a new tag category to organize your tags.
              </DialogDescription>
            </DialogHeader>
            <TagGroupCreateForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

