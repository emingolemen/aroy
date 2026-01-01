'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TagGroup } from '@/types/database'

interface IngredientTagDropdownProps {
  tagGroups: Array<TagGroup & { tags?: Array<{ id: string; name: string }> }>
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
}

export function IngredientTagDropdown({
  tagGroups,
  value,
  onValueChange,
  placeholder = 'Select ingredient...',
}: IngredientTagDropdownProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={(val) => onValueChange(val || null)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {tagGroups.map((group) => (
          <SelectGroup key={group.id}>
            <SelectLabel>{group.name}</SelectLabel>
            {(group.tags || []).map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

