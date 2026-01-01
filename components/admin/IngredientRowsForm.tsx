'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { IngredientTagDropdown } from './IngredientTagDropdown'
import { TagGroup } from '@/types/database'
import { IngredientRow } from '@/types/database'
import { Plus, Trash2 } from 'lucide-react'

interface IngredientRowsFormProps {
  value: IngredientRow[]
  onChange: (value: IngredientRow[]) => void
  tagGroups: Array<TagGroup & { tags?: Array<{ id: string; name: string }> }>
}

export function IngredientRowsForm({
  value,
  onChange,
  tagGroups,
}: IngredientRowsFormProps) {
  const [rows, setRows] = useState<IngredientRow[]>(value.length > 0 ? value : [{ quantity: '', tagId: null, notes: '' }])

  useEffect(() => {
    if (value.length > 0) {
      setRows(value)
    }
  }, [value])

  const updateRow = (index: number, field: keyof IngredientRow, fieldValue: string | null) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [field]: fieldValue }
    setRows(newRows)
    onChange(newRows)
  }

  const addRow = () => {
    const newRows = [...rows, { quantity: '', tagId: null, notes: '' }]
    setRows(newRows)
    onChange(newRows)
  }

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index)
      setRows(newRows)
      onChange(newRows)
    }
  }

  return (
    <div className="space-y-4 border rounded-lg p-4">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          <div className="md:col-span-3">
            <Input
              placeholder="Quantity"
              value={row.quantity}
              onChange={(e) => updateRow(index, 'quantity', e.target.value)}
            />
          </div>
          <div className="md:col-span-4">
            <IngredientTagDropdown
              tagGroups={tagGroups}
              value={row.tagId}
              onValueChange={(val) => updateRow(index, 'tagId', val)}
              placeholder="Select ingredient..."
            />
          </div>
          <div className="md:col-span-4">
            <Textarea
              placeholder="Notes"
              value={row.notes}
              onChange={(e) => updateRow(index, 'notes', e.target.value)}
              className="min-h-[40px]"
            />
          </div>
          <div className="md:col-span-1 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeRow(index)}
              disabled={rows.length === 1}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addRow}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Ingredient Row
      </Button>
    </div>
  )
}

