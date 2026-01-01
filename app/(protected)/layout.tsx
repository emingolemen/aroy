import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/utils'
import { Nav } from '@/components/layout/Nav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  const navLinks = [
    { href: '/favorites', label: 'Favorites' },
    { href: '/calendar', label: 'Calendar' },
  ]

  return (
    <div className="min-h-screen">
      <Nav navLinks={navLinks} />
      <main className="container mx-auto">{children}</main>
    </div>
  )
}

