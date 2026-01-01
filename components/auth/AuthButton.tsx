'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Heart, Calendar } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function AuthButton() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="w-10 h-10" />
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => router.push('/login')}>
          Login
        </Button>
        <Button onClick={() => router.push('/signup')}>Sign Up</Button>
      </div>
    )
  }

  const userRole = user.user_metadata?.role || 'viewer'

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => router.push('/favorites')}
        aria-label="Favorites"
      >
        <Heart className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => router.push('/calendar')}
        aria-label="Calendar"
      >
        <Calendar className="h-5 w-5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-lg" aria-label="Profile">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Role: {userRole}
          </div>
          {(userRole === 'contributor' || userRole === 'admin') && (
            <DropdownMenuItem onClick={() => router.push('/admin/recipes')}>
              Admin
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleSignOut}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

