import { Nav } from '@/components/layout/Nav'
import { getUser } from '@/lib/auth/utils'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  const navLinks = user
    ? [
        { href: '/favorites', label: 'Favorites' },
        { href: '/calendar', label: 'Calendar' },
      ]
    : undefined

  return (
    <div className="min-h-screen">
      <Nav navLinks={navLinks} />
      <main className="container mx-auto bg-white">{children}</main>
    </div>
  )
}

