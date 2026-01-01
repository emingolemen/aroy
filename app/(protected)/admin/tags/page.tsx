import { createClient } from '@/lib/supabase/server'
import { TagGroupForm } from '@/components/admin/TagGroupForm'
import { TagForm } from '@/components/admin/TagForm'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

async function getTagGroups() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tag_groups')
    .select(`
      *,
      tags (*)
    `)
    .order('display_order')
    .order('name', { foreignTable: 'tags' })

  if (error) {
    console.error('Error fetching tag groups:', error)
    return []
  }

  return data || []
}

export default async function AdminTagsPage() {
  const tagGroups = await getTagGroups()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Tags</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Tag Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag Group</DialogTitle>
              <DialogDescription>
                Create a new tag group to organize your tags.
              </DialogDescription>
            </DialogHeader>
            <TagGroupForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {tagGroups.map((group) => (
          <div key={group.id} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{group.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Display Order: {group.display_order}
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Tag to {group.name}</DialogTitle>
                  </DialogHeader>
                  <TagForm tagGroupId={group.id} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex flex-wrap gap-2">
              {(group.tags || []).map((tag: any) => (
                <div key={tag.id} className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-secondary rounded-md text-sm">
                    {tag.name}
                  </span>
                </div>
              ))}
              {(!group.tags || group.tags.length === 0) && (
                <p className="text-muted-foreground text-sm">No tags yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

