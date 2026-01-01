'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const tagGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  display_order: z.number().min(0),
})

type TagGroupFormData = z.infer<typeof tagGroupSchema>

export function TagGroupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TagGroupFormData>({
    resolver: zodResolver(tagGroupSchema),
    defaultValues: {
      display_order: 0,
    },
  })

  const onSubmit = async (data: TagGroupFormData) => {
    setLoading(true)
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
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tag Group Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_order">Display Order</Label>
        <Input
          id="display_order"
          type="number"
          {...register('display_order', { valueAsNumber: true })}
        />
        {errors.display_order && (
          <p className="text-sm text-red-600">{errors.display_order.message}</p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Tag Group'}
      </Button>
    </form>
  )
}

