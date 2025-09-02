import { useEffect, useRef, useCallback, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { supabase } from '../../lib/supabase/client'
import { showNotification } from '../../lib/notifications'
import { Loader2 } from 'lucide-react'

// Override Quill's list behavior
const List = Quill.import('formats/list')

class CustomList extends List {
  static create(value: string) {
    const node = super.create(value)
    if (value === 'bullet') {
      // Force UL for bullets
      if (node.tagName === 'OL') {
        const ul = document.createElement('UL')
        ul.innerHTML = node.innerHTML
        return ul
      }
    }
    return node
  }
}

CustomList.blotName = 'list'
CustomList.tagName = ['OL', 'UL']
CustomList.defaultChild = 'list-item'
CustomList.allowedChildren = ['list-item']

Quill.register(CustomList, true)

interface QuillBulletFixProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  height?: string
  enableDebugLogs?: boolean
}

export function QuillBulletFix({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  height = '200px',
  enableDebugLogs = false 
}: QuillBulletFixProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInternalChange = useRef(false)
  
  // Debug logging helper
  const debugLog = useCallback((message: string, data?: any) => {
    if (!enableDebugLogs) return
    console.log(`[QuillBulletFix] ${message}`, data || '')
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
    
    debugLog('Initializing Quill editor with bullet fix')
    
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
            image: () => fileInputRef.current?.click(),
            // Custom list handler
            list: function(value: string) {
              const range = quill.getSelection()
              if (range) {
                if (value === 'bullet') {
                  // Force bullet format
                  quill.format('list', 'bullet')
                  
                  // Additional fix: ensure it's a UL
                  setTimeout(() => {
                    const lists = quill.root.querySelectorAll('ol')
                    lists.forEach(ol => {
                      const items = ol.querySelectorAll('li[data-list="bullet"]')
                      if (items.length > 0) {
                        const ul = document.createElement('ul')
                        while (ol.firstChild) {
                          ul.appendChild(ol.firstChild)
                        }
                        ol.parentNode?.replaceChild(ul, ol)
                      }
                    })
                  }, 0)
                } else {
                  quill.format('list', value)
                }
              }
            }
          }
        }
      }
    })
    
    // Set initial content
    if (content && content !== '<p><br></p>') {
      quill.root.innerHTML = content
    }
    
    // Handle text changes
    quill.on('text-change', () => {
      if (isInternalChange.current) {
        isInternalChange.current = false
        return
      }
      
      const html = quill.root.innerHTML
      debugLog('Text changed', { preview: html.substring(0, 100) })
      
      if (html === '<p><br></p>') {
        onChange('')
      } else {
        onChange(html)
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
    if (!quillRef.current || isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    
    const currentHtml = quillRef.current.root.innerHTML
    
    // Skip if content is the same
    if (currentHtml === content) return
    
    // Skip if both are empty
    const currentEmpty = !currentHtml || currentHtml === '<p><br></p>'
    const newEmpty = !content || content === '<p><br></p>' || content === ''
    if (currentEmpty && newEmpty) return
    
    debugLog('Updating content from prop', {
      old: currentHtml?.substring(0, 50),
      new: content?.substring(0, 50)
    })
    
    // Mark as internal change to avoid triggering onChange
    isInternalChange.current = true
    
    // Use a timeout to prevent immediate re-render loops
    setTimeout(() => {
      if (quillRef.current) {
        quillRef.current.root.innerHTML = content || ''
        isInternalChange.current = false
      }
    }, 0)
  }, [content, debugLog])
  
  return (
    <div className="quill-bullet-fix-wrapper relative">
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
        /* FIX DOUBLE BULLETS - Hide the .ql-ui::before bullet since we have ::marker working */
        .quill-bullet-fix-wrapper .ql-editor ul {
          list-style-type: disc !important;
        }
        
        .quill-bullet-fix-wrapper .ql-editor ul li {
          list-style-type: disc !important;
        }
        
        .quill-bullet-fix-wrapper .ql-editor li[data-list="bullet"] {
          list-style-type: disc !important;
        }
        
        /* HIDE THE QUILL UI for bullets - We're using native ::marker now */
        .quill-bullet-fix-wrapper .ql-editor li[data-list="bullet"] > .ql-ui {
          display: none !important;
        }
        
        .quill-bullet-fix-wrapper .ql-editor li[data-list="bullet"] > .ql-ui::before {
          content: none !important;
          display: none !important;
        }
        
        /* FIX ORDERED LISTS - Use native numbering */
        .quill-bullet-fix-wrapper .ql-editor ol {
          list-style-type: decimal !important;
          counter-reset: none !important;
        }
        
        .quill-bullet-fix-wrapper .ql-editor ol li {
          list-style-type: decimal !important;
        }
        
        .quill-bullet-fix-wrapper .ql-editor li[data-list="ordered"] {
          list-style-type: decimal !important;
        }
        
        /* HIDE THE QUILL UI for ordered lists too */
        .quill-bullet-fix-wrapper .ql-editor li[data-list="ordered"] > .ql-ui {
          display: none !important;
        }
        
        .quill-bullet-fix-wrapper .ql-editor li[data-list="ordered"] > .ql-ui::before {
          content: none !important;
          display: none !important;
        }
        
        .quill-bullet-fix-wrapper .ql-toolbar {
          border: 1px solid #e5e7eb;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
          background: #f9fafb;
        }
        
        .quill-bullet-fix-wrapper .ql-container {
          border: 1px solid #e5e7eb;
          border-radius: 0 0 0.375rem 0.375rem;
          font-family: inherit;
          overflow: hidden;
        }
        
        .quill-bullet-fix-wrapper .ql-editor {
          min-height: ${height};
          max-height: 400px;
          overflow-y: auto;
          overflow-x: hidden;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }
        
        .quill-bullet-fix-wrapper .ql-editor * {
          max-width: 100%;
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        
        .quill-bullet-fix-wrapper .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
        
        .quill-bullet-fix-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
      `}</style>
    </div>
  )
}