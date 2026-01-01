import { CalendarView } from '@/components/calendar/CalendarView'
import { getUser } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ recipe?: string }>
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams

  return (
    <div className="m-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-0">Meal Calendar</h1>
      <CalendarView initialRecipeId={params.recipe} />
    </div>
  )
}

