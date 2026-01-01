'use client'

import { Badge } from '@/components/ui/badge'
import { TagGroup } from '@/types/database'

interface TagSelectorProps {
  tagGroups: Array<TagGroup & { tags?: Array<{ id: string; name: string }> }>
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
}

export function TagSelector({ tagGroups, selectedTagIds, onChange }: TagSelectorProps) {
  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  return (
    <div className="space-y-4 border rounded-lg p-4">
      {tagGroups.map((group) => (
        <div key={group.id} className="space-y-2">
          <h4 className="text-sm font-semibold">{group.name}</h4>
          <div className="flex flex-wrap gap-2">
            {(group.tags || []).map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

