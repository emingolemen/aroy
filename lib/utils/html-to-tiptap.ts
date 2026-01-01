/**
 * Convert HTML to proper Tiptap JSON format
 * Handles headings, lists (ul/ol), paragraphs, and links
 */

export function htmlToTiptapJSON(html: string): string {
  if (!html || !html.trim()) {
    return '{"type":"doc","content":[]}'
  }

  // If it's already JSON, return as is
  if (html.trim().startsWith('{')) {
    try {
      JSON.parse(html)
      return html
    } catch {
      // Invalid JSON, treat as HTML
    }
  }

  // Parse HTML and convert to Tiptap JSON structure
  const content: any[] = []
  let currentList: any[] | null = null
  let listType: 'bulletList' | 'orderedList' | null = null

  // Simple HTML parser (handles basic cases)
  const tempDiv = typeof document !== 'undefined' 
    ? document.createElement('div')
    : { innerHTML: html } as any

  if (typeof document !== 'undefined') {
    tempDiv.innerHTML = html
  }

  // Process nodes
  const processNode = (node: any): any[] => {
    const result: any[] = []

    if (node.nodeType === 3) { // Text node
      const text = node.textContent?.trim()
      if (text) {
        return [{
          type: 'paragraph',
          content: [{ type: 'text', text }]
        }]
      }
      return []
    }

    if (node.nodeType === 1) { // Element node
      const tagName = node.tagName?.toLowerCase()

      switch (tagName) {
        case 'h6':
          return [{
            type: 'heading',
            attrs: { level: 3 },
            content: extractTextContent(node)
          }]
        case 'h4':
        case 'h3':
          return [{
            type: 'heading',
            attrs: { level: 2 },
            content: extractTextContent(node)
          }]
        case 'h2':
          return [{
            type: 'heading',
            attrs: { level: 2 },
            content: extractTextContent(node)
          }]
        case 'ul':
          const bulletItems: any[] = []
          Array.from(node.children || []).forEach((li: any) => {
            if (li.tagName?.toLowerCase() === 'li') {
              bulletItems.push({
                type: 'listItem',
                content: [{
                  type: 'paragraph',
                  content: extractTextContent(li)
                }]
              })
            }
          })
          if (bulletItems.length > 0) {
            return [{
              type: 'bulletList',
              content: bulletItems
            }]
          }
          return []
        case 'ol':
          const orderedItems: any[] = []
          Array.from(node.children || []).forEach((li: any) => {
            if (li.tagName?.toLowerCase() === 'li') {
              orderedItems.push({
                type: 'listItem',
                content: [{
                  type: 'paragraph',
                  content: extractTextContent(li)
                }]
              })
            }
          })
          if (orderedItems.length > 0) {
            return [{
              type: 'orderedList',
              content: orderedItems
            }]
          }
          return []
        case 'p':
          const pText = extractTextContent(node)
          if (pText.length > 0) {
            // Check if it's a link
            const link = node.querySelector('a')
            if (link) {
              return [{
                type: 'paragraph',
                content: [{
                  type: 'text',
                  marks: [{
                    type: 'link',
                    attrs: { href: link.href || '#' }
                  }],
                  text: link.textContent || node.textContent
                }]
              }]
            }
            return [{
              type: 'paragraph',
              content: pText
            }]
          }
          return []
        case 'li':
          return [{
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: extractTextContent(node)
            }]
          }]
        default:
          // For other tags, extract text content
          const text = extractTextContent(node)
          if (text.length > 0) {
            return [{
              type: 'paragraph',
              content: text
            }]
          }
          return []
      }
    }

    return []
  }

  const extractTextContent = (node: any): any[] => {
    const result: any[] = []
    
    if (node.nodeType === 3) { // Text node
      const text = node.textContent?.trim()
      if (text) {
        result.push({ type: 'text', text })
      }
    } else if (node.nodeType === 1) { // Element node
      if (node.tagName?.toLowerCase() === 'a') {
        result.push({
          type: 'text',
          marks: [{
            type: 'link',
            attrs: { href: node.href || node.getAttribute('href') || '#' }
          }],
          text: node.textContent || ''
        })
      } else {
        // Process children
        Array.from(node.childNodes || []).forEach((child: any) => {
          const childContent = extractTextContent(child)
          result.push(...childContent)
        })
      }
    } else {
      // Process children
      Array.from(node.childNodes || []).forEach((child: any) => {
        const childContent = extractTextContent(child)
        result.push(...childContent)
      })
    }

    return result
  }

  // Server-side HTML parsing (simpler approach)
  if (typeof document === 'undefined') {
    // Parse HTML string manually
    const parts: any[] = []
    let inList = false
    let listItems: any[] = []
    let listIsOrdered = false

    // Extract headings
    const h6Matches = html.match(/<h6>(.*?)<\/h6>/gi)
    const h4Matches = html.match(/<h4>(.*?)<\/h4>/gi)
    const ulMatches = html.match(/<ul>(.*?)<\/ul>/gis)
    const olMatches = html.match(/<ol>(.*?)<\/ol>/gis)
    const pMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi)

    // Process headings
    if (h6Matches) {
      h6Matches.forEach(match => {
        const text = match.replace(/<[^>]+>/g, '').trim()
        if (text) {
          parts.push({
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text }]
          })
        }
      })
    }

    if (h4Matches) {
      h4Matches.forEach(match => {
        const text = match.replace(/<[^>]+>/g, '').trim()
        if (text) {
          parts.push({
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text }]
          })
        }
      })
    }

    // Process unordered lists
    if (ulMatches) {
      ulMatches.forEach(ulMatch => {
        const liMatches = ulMatch.match(/<li[^>]*>(.*?)<\/li>/gi)
        if (liMatches) {
          const listItems: any[] = []
          liMatches.forEach(liMatch => {
            const text = liMatch.replace(/<[^>]+>/g, '').trim()
            if (text) {
              listItems.push({
                type: 'listItem',
                content: [{
                  type: 'paragraph',
                  content: [{ type: 'text', text }]
                }]
              })
            }
          })
          if (listItems.length > 0) {
            parts.push({
              type: 'bulletList',
              content: listItems
            })
          }
        }
      })
    }

    // Process ordered lists
    if (olMatches) {
      olMatches.forEach(olMatch => {
        const liMatches = olMatch.match(/<li[^>]*>(.*?)<\/li>/gi)
        if (liMatches) {
          const listItems: any[] = []
          liMatches.forEach(liMatch => {
            const text = liMatch.replace(/<[^>]+>/g, '').trim()
            if (text) {
              listItems.push({
                type: 'listItem',
                content: [{
                  type: 'paragraph',
                  content: [{ type: 'text', text }]
                }]
              })
            }
          })
          if (listItems.length > 0) {
            parts.push({
              type: 'orderedList',
              content: listItems
            })
          }
        }
      })
    }

    // Process paragraphs (only if not already in lists)
    if (pMatches && !ulMatches && !olMatches) {
      pMatches.forEach(pMatch => {
        // Check if it contains a link
        const linkMatch = pMatch.match(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i)
        const text = pMatch.replace(/<[^>]+>/g, '').trim()
        
        if (linkMatch) {
          const href = linkMatch[1]
          const linkText = linkMatch[2].replace(/<[^>]+>/g, '').trim()
          parts.push({
            type: 'paragraph',
            content: [{
              type: 'text',
              marks: [{
                type: 'link',
                attrs: { href }
              }],
              text: linkText
            }]
          })
        } else if (text) {
          parts.push({
            type: 'paragraph',
            content: [{ type: 'text', text }]
          })
        }
      })
    }

    return JSON.stringify({
      type: 'doc',
      content: parts.length > 0 ? parts : [{
        type: 'paragraph',
        content: []
      }]
    })
  }

  // Client-side parsing (if available)
  if (tempDiv.children) {
    Array.from(tempDiv.children).forEach((child: any) => {
      const processed = processNode(child)
      content.push(...processed)
    })
  }

  return JSON.stringify({
    type: 'doc',
    content: content.length > 0 ? content : [{
      type: 'paragraph',
      content: []
    }]
  })
}

