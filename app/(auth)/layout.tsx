import { Nav } from '@/components/layout/Nav'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Nav simple showAuthButton={false} />
      <main>{children}</main>
    </div>
  )
}

