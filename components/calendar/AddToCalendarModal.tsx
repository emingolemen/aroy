'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { RecipeSelector } from '@/components/calendar/RecipeSelector'
import { CalendarEntry, MealType } from '@/types/database'
import { format, isSameDay } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

interface AddToCalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecipeId?: string
  initialDate?: Date
  onSave?: () => void
}

export function AddToCalendarModal({
  open,
  onOpenChange,
  initialRecipeId,
  initialDate,
  onSave,
}: AddToCalendarModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate || new Date()
  )
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(
    initialRecipeId || null
  )
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState<CalendarEntry[]>([])

  useEffect(() => {
    if (open && initialDate) {
      setSelectedDate(initialDate)
    } else if (open && !initialDate) {
      setSelectedDate(new Date())
    }
  }, [open, initialDate])

  useEffect(() => {
    if (open && initialRecipeId) {
      setSelectedRecipeId(initialRecipeId)
    }
  }, [open, initialRecipeId])

  useEffect(() => {
    if (open && selectedDate) {
      loadEntriesForDate(selectedDate)
    }
  }, [open, selectedDate])

  const loadEntriesForDate = async (date: Date) => {
    const supabase = createClient()
    const dateStr = format(date, 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('calendar_entries')
      .select('*')
      .eq('date', dateStr)

    if (error) {
      console.error('Error loading entries:', error)
      setEntries([])
    } else {
      const loadedEntries = data || []
      setEntries(loadedEntries)
      
      // Auto-select meal type based on existing entries
      if (loadedEntries.length > 0) {
        const breakfast = loadedEntries.find(e => e.meal_type === 'breakfast')
        const lunch = loadedEntries.find(e => e.meal_type === 'lunch')
        const dinner = loadedEntries.find(e => e.meal_type === 'dinner')
        
        if (!breakfast) setSelectedMealType('breakfast')
        else if (!lunch) setSelectedMealType('lunch')
        else if (!dinner) setSelectedMealType('dinner')
        else setSelectedMealType('breakfast')
      } else {
        setSelectedMealType('breakfast')
      }
    }
  }

  const handleSaveEntry = async () => {
    const recipeId = selectedRecipeId
    if (!selectedDate || !selectedMealType || !recipeId) {
      alert('Please select a date, meal type, and recipe')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please log in to add recipes to calendar')
      return
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    // Check if entry exists
    const existing = entries.find(
      e => isSameDay(new Date(e.date), selectedDate) && e.meal_type === selectedMealType
    )

    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('calendar_entries')
        .update({
          recipe_id: recipeId,
          notes: notes || null,
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating entry:', error)
        alert('Error updating calendar entry. Please try again.')
        return
      }
    } else {
      // Create new entry
      const { error } = await supabase
        .from('calendar_entries')
        .insert({
          user_id: user.id,
          recipe_id: recipeId,
          date: dateStr,
          meal_type: selectedMealType,
          notes: notes || null,
        })

      if (error) {
        console.error('Error creating entry:', error)
        alert('Error creating calendar entry. Please try again.')
        return
      }
    }

    // Reset form
    setSelectedDate(new Date())
    setSelectedMealType(null)
    setSelectedRecipeId(initialRecipeId || null)
    setNotes('')
    onOpenChange(false)
    
    // Call onSave callback if provided
    if (onSave) {
      onSave()
    }
  }

  const handleCancel = () => {
    setSelectedDate(initialDate || new Date())
    setSelectedMealType(null)
    setSelectedRecipeId(initialRecipeId || null)
    setNotes('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedDate ? `Add Recipe for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Add Recipe to Calendar'}
          </DialogTitle>
          <DialogDescription>
            Select a date, meal type, and recipe for this day.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date)
                      loadEntriesForDate(date)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <Select
              value={selectedMealType || ''}
              onValueChange={(value) => setSelectedMealType(value as MealType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Recipe</Label>
            <RecipeSelector
              onSelect={(recipe) => setSelectedRecipeId(recipe.id)}
              initialRecipeId={initialRecipeId || selectedRecipeId || undefined}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes for this meal..."
            />
          </div>
          <div className="pt-4 flex gap-2">
            <Button
              onClick={handleSaveEntry}
              disabled={!selectedDate || !selectedMealType || !selectedRecipeId}
              className="flex-1"
            >
              Save to Calendar
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

