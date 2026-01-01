import Link from 'next/link'
import { AuthButton } from '@/components/auth/AuthButton'
import { NavSearchBar } from './NavSearchBar'

interface NavLink {
  href: string
  label: string
}

interface NavProps {
  navLinks?: NavLink[]
  showAuthButton?: boolean
  simple?: boolean
}

export function Nav({ navLinks, showAuthButton = true, simple = false }: NavProps) {
  if (simple) {
    return (
      <nav className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold">
            Aroy
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Aroy
        </Link>
        <div className="flex-1 max-w-md mx-4">
          <NavSearchBar />
        </div>
        <div className="flex items-center">
          {showAuthButton && <AuthButton />}
        </div>
      </div>
    </nav>
  )
}

