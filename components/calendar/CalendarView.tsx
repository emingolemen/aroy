'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddToCalendarModal } from '@/components/calendar/AddToCalendarModal'
import { CalendarEntry } from '@/types/database'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  isToday
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'

interface CalendarViewProps {
  initialRecipeId?: string
}

export function CalendarView({ initialRecipeId }: CalendarViewProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEntries()
  }, [date])

  useEffect(() => {
    if (initialRecipeId) {
      setSelectedDate(new Date())
      setOpen(true)
    }
  }, [initialRecipeId])

  const loadEntries = async () => {
    const supabase = createClient()
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    const { data, error } = await supabase
      .from('calendar_entries')
      .select(`
        *,
        recipe:recipes (
          id,
          name,
          slug,
          image_url
        )
      `)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date')
      .order('meal_type')

    if (error) {
      console.error('Error loading entries:', error)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => isSameDay(new Date(entry.date), date))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    setOpen(true)
  }

  const handleDeleteEntry = async (entryId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('calendar_entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      console.error('Error deleting entry:', error)
    } else {
      loadEntries()
    }
  }

  const getCalendarDays = () => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }) // Monday
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline"
          onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Month
        </Button>
        <h2 className="text-xl font-semibold">{format(date, 'MMMM yyyy')}</h2>
        <Button 
          variant="outline"
          onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
        >
          Next Month
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7">
          {getCalendarDays().map((day, idx) => {
            const dayEntries = getEntriesForDate(day)
            const isCurrentMonth = isSameMonth(day, date)
            const isTodayDate = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[120px] border-r border-b last:border-r-0 p-2
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                  ${isTodayDate ? 'bg-accent/20' : ''}
                  hover:bg-accent/50 cursor-pointer transition-colors
                  flex flex-col
                `}
                onClick={() => handleDateSelect(day)}
              >
                {/* Day Number */}
                <div className={`
                  text-sm font-medium mb-1
                  ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                  ${isTodayDate ? 'text-primary font-bold' : ''}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Recipe Entries */}
                <div className="flex-1 space-y-1 overflow-y-auto">
                  {dayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge
                        variant="secondary"
                        className="w-full justify-start text-xs p-1 pr-6 hover:bg-secondary/80"
                      >
                        <span className="font-semibold mr-1">
                          {entry.meal_type === 'breakfast' ? 'B' : 
                           entry.meal_type === 'lunch' ? 'L' : 'D'}:
                        </span>
                        <span className="truncate">{entry.recipe?.name}</span>
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEntry(entry.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {dayEntries.length === 0 && (
                    <div className="text-xs text-muted-foreground/50 mt-1">
                      <Plus className="h-3 w-3 inline" /> Click to add
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <AddToCalendarModal
        open={open}
        onOpenChange={setOpen}
        initialRecipeId={initialRecipeId || undefined}
        initialDate={selectedDate || undefined}
        onSave={loadEntries}
      />
    </div>
  )
}

