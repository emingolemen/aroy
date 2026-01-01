'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from 'react'

interface RichTextRendererProps {
  content: string
  className?: string
}

export function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: content || '{"type":"doc","content":[]}',
    editable: false,
    immediatelyRender: false,
  }, [mounted])

  // Update editor content when it changes
  useEffect(() => {
    if (editor && mounted && content) {
      try {
        const parsed = JSON.parse(content)
        editor.commands.setContent(parsed)
      } catch (e) {
        // If content is not valid JSON, try to set as HTML
        editor.commands.setContent(content)
      }
    }
  }, [editor, mounted, content])

  // Render plain content during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`prose prose-sm max-w-none ${className}`}>
        <div dangerouslySetInnerHTML={{ __html: renderHTML(content) }} />
      </div>
    )
  }

  if (!editor) {
    return (
      <div className={`prose prose-sm max-w-none ${className}`}>
        <div dangerouslySetInnerHTML={{ __html: renderHTML(content) }} />
      </div>
    )
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <EditorContent editor={editor} />
    </div>
  )
}

function renderHTML(content: string): string {
  if (!content) return ''
  
  try {
    const parsed = JSON.parse(content)
    return renderNode(parsed)
  } catch {
    // If not JSON, return as-is (might be plain HTML)
    return content
  }
}

function renderNode(node: any): string {
  if (!node) return ''

  if (node.type === 'text') {
    const text = node.text || ''
    // Handle marks (bold, italic, etc.)
    if (node.marks && node.marks.length > 0) {
      let result = text
      // Apply marks in reverse order (inner to outer)
      for (let i = node.marks.length - 1; i >= 0; i--) {
        const mark = node.marks[i]
        if (mark.type === 'bold') {
          result = `<strong>${result}</strong>`
        } else if (mark.type === 'italic') {
          result = `<em>${result}</em>`
        } else if (mark.type === 'link') {
          const href = mark.attrs?.href || '#'
          result = `<a href="${href}" class="text-blue-600 underline">${result}</a>`
        }
      }
      return result
    }
    return escapeHtml(text)
  }

  if (node.type === 'hardBreak') {
    return '<br/>'
  }

  if (node.content && Array.isArray(node.content)) {
    const children = node.content.map(renderNode).join('')
    
    switch (node.type) {
      case 'doc':
        // Group consecutive paragraphs that start with "- " into lists
        return groupIntoLists(node.content)
      case 'paragraph':
        return children ? `<p>${children}</p>` : '<p><br/></p>'
      case 'heading':
        const level = node.attrs?.level || 2
        return `<h${level} class="font-semibold mt-6 mb-2">${children}</h${level}>`
      case 'bulletList':
        return `<ul class="list-disc list-inside space-y-1 my-2">${children}</ul>`
      case 'orderedList':
        return `<ol class="list-decimal list-inside space-y-1 my-2">${children}</ol>`
      case 'listItem':
        // List items might contain paragraphs or direct content
        const itemContent = node.content?.map(renderNode).join('') || ''
        return `<li class="ml-4">${itemContent}</li>`
      case 'link':
        const href = node.attrs?.href || '#'
        return `<a href="${href}" class="text-blue-600 underline hover:text-blue-800">${children}</a>`
      default:
        return children
    }
  }

  return ''
}

// Group consecutive paragraphs starting with "- " into bullet lists
function groupIntoLists(nodes: any[]): string {
  const result: string[] = []
  let currentList: any[] = []
  let inList = false

  for (const node of nodes) {
    if (node.type === 'paragraph' && node.content && node.content.length > 0) {
      const firstText = node.content[0]
      if (firstText.type === 'text' && firstText.text.trim().startsWith('- ')) {
        // Start or continue a list
        if (!inList && currentList.length > 0) {
          // Flush previous content
          result.push(currentList.map(renderNode).join(''))
          currentList = []
        }
        inList = true
        currentList.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{
              ...firstText,
              text: firstText.text.trim().substring(2) // Remove "- "
            }, ...node.content.slice(1)]
          }]
        })
        continue
      }
    }

    // Not a list item
    if (inList && currentList.length > 0) {
      // Flush the list
      result.push(`<ul class="list-disc list-inside space-y-1 my-2">${currentList.map(renderNode).join('')}</ul>`)
      currentList = []
      inList = false
    }

    // Add regular content
    result.push(renderNode(node))
  }

  // Flush any remaining list
  if (inList && currentList.length > 0) {
    result.push(`<ul class="list-disc list-inside space-y-1 my-2">${currentList.map(renderNode).join('')}</ul>`)
  }

  return result.join('')
}

function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null
  if (div) {
    div.textContent = text
    return div.innerHTML
  }
  // Fallback for server-side
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

