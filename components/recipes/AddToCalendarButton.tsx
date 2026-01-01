'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { AddToCalendarModal } from '@/components/calendar/AddToCalendarModal'

interface AddToCalendarButtonProps {
  recipeId: string
  recipeName: string
}

export function AddToCalendarButton({ recipeId, recipeName }: AddToCalendarButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Add to Calendar
      </Button>
      <AddToCalendarModal
        open={open}
        onOpenChange={setOpen}
        initialRecipeId={recipeId}
      />
    </>
  )
}

