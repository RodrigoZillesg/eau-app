import { useState, useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote,
  Link as LinkIcon,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Underline
} from 'lucide-react'

interface SimpleRichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function SimpleRichTextEditor({ content, onChange, placeholder }: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState('')

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content || ''
    }
  }, [content])

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
    editorRef.current?.focus()
  }

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag)
  }

  const createLink = () => {
    const url = window.prompt('Enter URL:', 'https://')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const insertList = (type: 'ordered' | 'unordered') => {
    execCommand(type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList')
  }

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      onChange(html === '<br>' ? '' : html)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Add Tab support for lists
    if (e.key === 'Tab') {
      e.preventDefault()
      execCommand('indent')
    }
  }

  const updateSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      setSelectedText(selection.toString())
    }
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">
        {/* Format Selector */}
        <select
          onChange={(e) => formatBlock(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
          defaultValue=""
        >
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="p">Paragraph</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => insertList('unordered')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => insertList('ordered')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => formatBlock('blockquote')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={createLink}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] max-h-[400px] overflow-y-auto p-3 bg-white focus:outline-none prose prose-sm max-w-none"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={updateSelection}
        onKeyUp={updateSelection}
        placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: content || '' }}
      />

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-300 px-3 py-1 text-xs text-gray-600 flex justify-between">
        <span>{(content || '').replace(/<[^>]*>/g, '').length} characters</span>
        {selectedText && <span>Selected: {selectedText.length} chars</span>}
      </div>
    </div>
  )
}