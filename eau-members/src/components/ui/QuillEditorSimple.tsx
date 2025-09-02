import { useEffect, useRef, useCallback, useState } from 'react'
import Quill from 'quill'
import '../../styles/quill-fixed.css'
import { supabase } from '../../lib/supabase/client'
import { showNotification } from '../../lib/notifications'
import { Loader2 } from 'lucide-react'

interface QuillEditorSimpleProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  height?: string
  enableDebugLogs?: boolean
}

export function QuillEditorSimple({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  height = '200px',
  enableDebugLogs = false 
}: QuillEditorSimpleProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInternalChange = useRef(false)
  
  // Debug logging helper
  const debugLog = useCallback((message: string, data?: any) => {
    if (!enableDebugLogs) return
    console.log(`[QuillEditor] ${message}`, data || '')
  }, [enableDebugLogs])
  
  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setIsUploading(true)
      debugLog('Starting image upload', { fileName: file.name })
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB')
      }
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `editor-images/${fileName}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
        })
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)
      
      // Insert image into editor
      if (quillRef.current) {
        const range = quillRef.current.getSelection() || { index: 0 }
        quillRef.current.insertEmbed(range.index, 'image', publicUrl)
        quillRef.current.setSelection(range.index + 1)
      }
      
      showNotification('success', 'Image uploaded successfully')
    } catch (error: any) {
      debugLog('Image upload failed', error)
      showNotification('error', error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [debugLog])
  
  // Initialize Quill only once
  useEffect(() => {
    if (!editorRef.current || quillRef.current) return
    
    debugLog('Initializing Quill editor')
    
    // Configure Quill
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: {
          container: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'bullet' }, { 'list': 'ordered' }],
            ['link', 'image'],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
          ],
          handlers: {
            image: () => fileInputRef.current?.click()
          }
        }
      }
    })
    
    // Set initial content
    if (content && content !== '<p><br></p>') {
      quill.root.innerHTML = content
    }
    
    // FORCE BULLETS WITH INLINE STYLES
    const styleSheet = document.createElement('style')
    styleSheet.textContent = `
      ${editorRef.current.id ? `#${editorRef.current.id}` : ''} .ql-editor li[data-list="bullet"] {
        list-style-type: disc !important;
      }
      ${editorRef.current.id ? `#${editorRef.current.id}` : ''} .ql-editor ul li {
        list-style-type: disc !important;
      }
      ${editorRef.current.id ? `#${editorRef.current.id}` : ''} .ql-editor ul {
        list-style-type: disc !important;
      }
    `
    document.head.appendChild(styleSheet)
    
    // Add unique ID to editor for targeting
    const editorId = `quill-editor-${Math.random().toString(36).substr(2, 9)}`
    editorRef.current.id = editorId
    
    // Handle text changes
    quill.on('text-change', () => {
      if (isInternalChange.current) {
        isInternalChange.current = false
        return
      }
      
      const html = quill.root.innerHTML
      debugLog('Text changed', { preview: html.substring(0, 100) })
      
      // FORCE BULLETS: Remove data-list="ordered" from bullet lists
      const bulletLists = quill.root.querySelectorAll('li[data-list="bullet"]')
      bulletLists.forEach(li => {
        // Force the list item to show as bullet
        const parent = li.parentElement
        if (parent && parent.tagName === 'OL') {
          // Convert OL to UL if it contains bullets
          const ul = document.createElement('ul')
          ul.innerHTML = parent.innerHTML
          parent.parentNode?.replaceChild(ul, parent)
        }
      })
      
      // Fix any list items that might be showing as numbers
      const allLists = quill.root.querySelectorAll('ul')
      allLists.forEach(ul => {
        ul.style.listStyleType = 'disc'
        ul.querySelectorAll('li').forEach(li => {
          li.style.listStyleType = 'disc'
        })
      })
      
      const updatedHtml = quill.root.innerHTML
      
      if (updatedHtml === '<p><br></p>') {
        onChange('')
      } else {
        onChange(updatedHtml)
      }
    })
    
    // Handle paste events for images
    quill.root.addEventListener('paste', async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await handleImageUpload(file)
          }
        }
      }
    })
    
    quillRef.current = quill
    
    // Cleanup
    return () => {
      quill.off('text-change')
    }
  }, []) // Only run once on mount
  
  // Update content when prop changes (but not from our own changes)
  useEffect(() => {
    if (!quillRef.current) return
    
    const currentHtml = quillRef.current.root.innerHTML
    
    // Skip if content is the same
    if (currentHtml === content) return
    
    // Skip if both are empty
    const currentEmpty = !currentHtml || currentHtml === '<p><br></p>'
    const newEmpty = !content || content === '<p><br></p>' || content === ''
    if (currentEmpty && newEmpty) return
    
    debugLog('Updating content from prop', {
      old: currentHtml.substring(0, 50),
      new: content.substring(0, 50)
    })
    
    // Mark as internal change to avoid triggering onChange
    isInternalChange.current = true
    quillRef.current.root.innerHTML = content || ''
  }, [content, debugLog])
  
  return (
    <div className="quill-editor-wrapper relative">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            handleImageUpload(file)
          }
        }}
      />
      
      {/* Loading overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-md">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Uploading image...</span>
          </div>
        </div>
      )}
      
      {/* Quill editor container */}
      <div 
        ref={editorRef}
        style={{ height }}
        className="bg-white"
      />
      
      <style>{`
        .quill-editor-wrapper .ql-toolbar {
          border: 1px solid #e5e7eb;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
          background: #f9fafb;
        }
        
        .quill-editor-wrapper .ql-container {
          border: 1px solid #e5e7eb;
          border-radius: 0 0 0.375rem 0.375rem;
          font-family: inherit;
          overflow: hidden;
        }
        
        .quill-editor-wrapper .ql-editor {
          min-height: ${height};
          max-height: 400px;
          overflow-y: auto;
          overflow-x: hidden;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }
        
        .quill-editor-wrapper .ql-editor * {
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        
        .quill-editor-wrapper .ql-editor p,
        .quill-editor-wrapper .ql-editor li,
        .quill-editor-wrapper .ql-editor h1,
        .quill-editor-wrapper .ql-editor h2,
        .quill-editor-wrapper .ql-editor h3,
        .quill-editor-wrapper .ql-editor h4,
        .quill-editor-wrapper .ql-editor h5,
        .quill-editor-wrapper .ql-editor h6 {
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        
        .quill-editor-wrapper .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
        
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        
        /* Nested bullets */
        .quill-editor-wrapper .ql-editor ul ul {
          list-style-type: circle !important;
        }
        
        .quill-editor-wrapper .ql-editor ul ul ul {
          list-style-type: square !important;
        }
        
        /* Ensure ordered lists remain numbered */
        .quill-editor-wrapper .ql-editor ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
        }
        
        .quill-editor-wrapper .ql-editor ol li {
          list-style-type: decimal !important;
          display: list-item !important;
        }
      `}</style>
    </div>
  )
}