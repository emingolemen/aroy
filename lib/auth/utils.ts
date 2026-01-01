import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/types/database'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getUser()
  if (!user) return null
  
  const role = user.user_metadata?.role as UserRole
  return role || 'viewer'
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(requiredRole: UserRole) {
  const user = await requireAuth()
  const role = await getUserRole()
  
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    contributor: 2,
    admin: 3,
  }
  
  if (!role || roleHierarchy[role] < roleHierarchy[requiredRole]) {
    throw new Error('Insufficient permissions')
  }
  
  return user
}

