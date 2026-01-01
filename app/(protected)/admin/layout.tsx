import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/utils'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireRole('contributor')
  } catch {
    redirect('/')
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto">{children}</main>
    </div>
  )
}

