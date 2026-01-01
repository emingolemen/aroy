'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

export default function ImportCSVPage() {
  const [tagGroupsFile, setTagGroupsFile] = useState<File | null>(null)
  const [tagsFile, setTagsFile] = useState<File | null>(null)
  const [recipesFile, setRecipesFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    error?: string
    tagGroups?: number
    tags?: number
    recipes?: number
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tagGroupsFile || !tagsFile || !recipesFile) {
      setResult({
        success: false,
        error: 'Please upload all three CSV files',
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('tagGroups', tagGroupsFile)
      formData.append('tags', tagsFile)
      formData.append('recipes', recipesFile)

      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          tagGroups: data.tagGroups,
          tags: data.tags,
          recipes: data.recipes,
        })
      } else {
        setResult({
          success: false,
          error: data.error || 'Import failed',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import from CSV</h1>
        <p className="text-muted-foreground">
          Import tag groups, tags, and recipes from CSV files
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV Files</CardTitle>
          <CardDescription>
            Upload three CSV files: tag groups, tags, and recipes. See{' '}
            <a
              href="/CSV_IMPORT_GUIDE.md"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              CSV Import Guide
            </a>{' '}
            for format details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tagGroups">Tag Groups CSV</Label>
              <Input
                id="tagGroups"
                type="file"
                accept=".csv"
                onChange={(e) => setTagGroupsFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Format: name,display_order
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags CSV</Label>
              <Input
                id="tags"
                type="file"
                accept=".csv"
                onChange={(e) => setTagsFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Format: name,tag_group
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipes">Recipes CSV</Label>
              <Input
                id="recipes"
                type="file"
                accept=".csv"
                onChange={(e) => setRecipesFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Format: name,slug,image_url,tags,ingredients,ingredients_text,instructions,inspiration
              </p>
            </div>

            {result && (
              <div
                className={`p-4 rounded-lg ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    {result.success ? (
                      <div>
                        <p className="font-semibold text-green-900">
                          {result.message}
                        </p>
                        {result.tagGroups !== undefined && (
                          <p className="text-sm text-green-700 mt-1">
                            Tag Groups: {result.tagGroups} | Tags: {result.tags} | Recipes: {result.recipes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="font-semibold text-red-900">
                        {result.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV Files
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>CSV Format Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">tag-groups.csv</h3>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`name,display_order
Cuisine,0
Type,1
Ingredients,2`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">tags.csv</h3>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`name,tag_group
Chinese,Cuisine
Thai,Cuisine
Stir-fry,Type`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">recipes.csv</h3>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`name,slug,image_url,tags,ingredients,ingredients_text,instructions,inspiration
"Pad Thai","pad-thai","","Thai,Stir-fry","Chicken,Rice","- Rice noodles\\n- Chicken","1. Cook noodles\\n2. Add chicken",""`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

