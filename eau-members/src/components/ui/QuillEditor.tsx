import { useEffect, useRef, useCallback, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { supabase } from '../../lib/supabase/client'
import { showNotification } from '../../lib/notifications'
import { Loader2 } from 'lucide-react'

interface QuillEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  height?: string
  enableDebugLogs?: boolean
}

export function QuillEditor({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  height = '200px',
  enableDebugLogs = true 
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const onChangeRef = useRef(onChange)
  
  // Debug logging helper
  const debugLog = useCallback((message: string, data?: any) => {
    if (!enableDebugLogs) return
    const timestamp = new Date().toISOString()
    console.group(`[QuillEditor ${timestamp}] ${message}`)
    if (data) {
      console.log('Data:', data)
    }
    console.groupEnd()
  }, [enableDebugLogs])
  
  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setIsUploading(true)
      debugLog('Starting image upload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      
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
      
      debugLog('Uploading to Supabase', { filePath })
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
        })
      
      if (error) {
        debugLog('Upload error', error)
        throw error
      }
      
      debugLog('Upload successful', data)
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)
      
      debugLog('Public URL generated', { publicUrl })
      
      // Insert image into editor
      if (quillRef.current) {
        const range = quillRef.current.getSelection()
        const position = range ? range.index : 0
        quillRef.current.insertEmbed(position, 'image', publicUrl)
        quillRef.current.setSelection(position + 1)
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
  
  // Custom image handler
  const imageHandler = useCallback(() => {
    debugLog('Image button clicked')
    fileInputRef.current?.click()
  }, [debugLog])
  
  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  
  // Initialize Quill
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
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['clean']
          ],
          handlers: {
            image: imageHandler
          }
        },
        clipboard: {
          matchVisual: false
        }
      }
    })
    
    // Set initial content
    if (content) {
      debugLog('Setting initial content', { content })
      quill.root.innerHTML = content
    }
    
    // Handle text changes
    quill.on('text-change', (delta, oldDelta, source) => {
      debugLog('Text changed', { 
        source, 
        deltaOps: delta.ops?.length,
        html: quill.root.innerHTML 
      })
      
      const html = quill.root.innerHTML
      if (html === '<p><br></p>') {
        onChangeRef.current('')
      } else {
        onChangeRef.current(html)
      }
    })
    
    // Handle selection changes
    quill.on('selection-change', (range, oldRange, source) => {
      debugLog('Selection changed', { range, oldRange, source })
    })
    
    // Handle paste events for images
    quill.root.addEventListener('paste', async (e: ClipboardEvent) => {
      debugLog('Paste event detected')
      
      const items = e.clipboardData?.items
      if (!items) return
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            debugLog('Image pasted', { fileName: file.name, fileType: file.type })
            await handleImageUpload(file)
          }
        }
      }
    })
    
    quillRef.current = quill
    debugLog('Quill editor initialized successfully')
    
    return () => {
      debugLog('Cleaning up Quill editor')
      quill.off('text-change')
      quill.off('selection-change')
    }
  }, [placeholder, imageHandler, handleImageUpload, debugLog]) // Removed onChange from deps
  
  // Update content when prop changes
  useEffect(() => {
    if (!quillRef.current) return
    
    const currentHtml = quillRef.current.root.innerHTML
    const emptyContent = currentHtml === '<p><br></p>' || currentHtml === ''
    const newEmptyContent = !content || content === ''
    
    debugLog('Content prop check', {
      currentHtml: currentHtml?.substring(0, 100),
      propContent: content?.substring(0, 100),
      willUpdate: currentHtml !== content && !(emptyContent && newEmptyContent)
    })
    
    // Only update if content actually changed
    if (emptyContent && newEmptyContent) return
    if (currentHtml === content) return
    
    debugLog('Updating content from prop', {
      oldContent: currentHtml,
      newContent: content
    })
    
    // Temporarily disable text-change listener while updating
    quillRef.current.off('text-change')
    quillRef.current.root.innerHTML = content || ''
    
    // Re-enable listener after a tick
    setTimeout(() => {
      if (!quillRef.current) return
      
      quillRef.current.on('text-change', (delta, oldDelta, source) => {
        debugLog('Text changed (re-attached)', { 
          source, 
          deltaOps: delta.ops?.length,
          html: quillRef.current?.root.innerHTML 
        })
        
        const html = quillRef.current?.root.innerHTML || ''
        if (html === '<p><br></p>') {
          onChangeRef.current('')
        } else {
          onChangeRef.current(html)
        }
      })
    }, 0)
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
            debugLog('File selected', { fileName: file.name })
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
        .quill-editor-wrapper .ql-editor h6,
        .quill-editor-wrapper .ql-editor blockquote {
          word-wrap: break-word;
          word-break: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
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
        
        .quill-editor-wrapper .ql-snow .ql-tooltip {
          z-index: 100;
        }
        
        /* Custom scrollbar */
        .quill-editor-wrapper .ql-editor::-webkit-scrollbar {
          width: 8px;
        }
        
        .quill-editor-wrapper .ql-editor::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .quill-editor-wrapper .ql-editor::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .quill-editor-wrapper .ql-editor::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  )
}