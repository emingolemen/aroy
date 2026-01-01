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

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type TagFormData = z.infer<typeof tagSchema>

interface TagFormProps {
  tagGroupId: string
}

export function TagForm({ tagGroupId }: TagFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
  })

  const onSubmit = async (data: TagFormData) => {
    setLoading(true)
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
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tag Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Tag'}
      </Button>
    </form>
  )
}

