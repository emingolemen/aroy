import { RecipeForm } from '@/components/admin/RecipeForm'

export default function NewRecipePage() {
  return (
    <div className="m-4">
      <h1 className="text-3xl font-bold mb-8">Create New Recipe</h1>
      <RecipeForm />
    </div>
  )
}

