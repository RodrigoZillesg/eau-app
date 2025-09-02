import { useState } from 'react'
import { Bold, Italic, List, ListOrdered, Quote, Link, Heading1, Heading2, Eye, Edit } from 'lucide-react'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function MarkdownEditor({ content, onChange, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [text, setText] = useState(content || '')

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = text.substring(start, end)
    
    const newText = 
      text.substring(0, start) + 
      before + selectedText + after +
      text.substring(end)
    
    setText(newText)
    onChange(convertToHtml(newText))
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  const convertToHtml = (markdown: string): string => {
    let html = markdown
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>')
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>')
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>')
    html = '<p>' + html + '</p>'
    
    // Clean up
    html = html.replace(/<p><\/p>/g, '')
    html = html.replace(/<p>(<h[1-3]>)/g, '$1')
    html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1')
    
    return html
  }

  const handleTextChange = (value: string) => {
    setText(value)
    onChange(convertToHtml(value))
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-300 bg-gray-50">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertMarkdown('# ')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => insertMarkdown('## ')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <button
            type="button"
            onClick={() => insertMarkdown('**', '**')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => insertMarkdown('*', '*')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <button
            type="button"
            onClick={() => insertMarkdown('* ')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => insertMarkdown('1. ')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => insertMarkdown('> ')}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <button
            type="button"
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                insertMarkdown('[', `](${url})`)
              }
            }}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`p-1.5 rounded transition-colors ${
              mode === 'edit' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-200'
            }`}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`p-1.5 rounded transition-colors ${
              mode === 'preview' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-200'
            }`}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      {mode === 'edit' ? (
        <textarea
          id="markdown-editor"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder || 'Enter your content here...\n\nUse:\n# for headings\n**text** for bold\n*text* for italic\n* for bullet lists\n[text](url) for links'}
          className="w-full min-h-[200px] max-h-[400px] p-3 bg-white focus:outline-none resize-y font-mono text-sm"
        />
      ) : (
        <div 
          className="min-h-[200px] max-h-[400px] overflow-y-auto p-3 bg-white prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: convertToHtml(text) }}
        />
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-1 text-xs text-gray-600 bg-gray-50 border-t border-gray-300">
        <span>{text.length} characters</span>
        <span>{mode === 'edit' ? 'Markdown supported' : 'Preview mode'}</span>
      </div>
    </div>
  )
}