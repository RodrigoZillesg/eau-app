import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { showNotification } from '../../utils/notifications'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Code
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  enableDebugLogs?: boolean
}

export function RichTextEditor({ content, onChange, placeholder, enableDebugLogs = true }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadingRef = useRef(false)
  
  // Debug logging helper
  const debugLog = useCallback((message: string, data?: any) => {
    if (!enableDebugLogs) return
    const timestamp = new Date().toISOString()
    console.group(`[RichTextEditor ${timestamp}] ${message}`)
    if (data) {
      console.log('Data:', data)
    }
    console.trace('Stack trace')
    console.groupEnd()
  }, [enableDebugLogs])
  
  debugLog('Component mounting', { content, placeholder })
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
    onCreate: ({ editor }) => {
      debugLog('Editor created', { 
        html: editor.getHTML(),
        text: editor.getText(),
        isEmpty: editor.isEmpty
      })
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      debugLog('Editor updated', { 
        html,
        text: editor.getText(),
        isEmpty: editor.isEmpty
      })
      onChange(html)
    },
    onSelectionUpdate: ({ editor }) => {
      debugLog('Selection updated', {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
        empty: editor.state.selection.empty
      })
    },
    onTransaction: ({ transaction }) => {
      debugLog('Transaction', {
        docChanged: transaction.docChanged,
        steps: transaction.steps.length,
        selection: transaction.selection
      })
    },
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      debugLog('Updating content from prop', {
        oldContent: editor.getHTML(),
        newContent: content
      })
      editor.commands.setContent(content || '')
    }
  }, [content, editor, debugLog])

  if (!editor) {
    return null
  }

  const addLink = useCallback(() => {
    try {
      const previousUrl = editor?.getAttributes('link').href
      debugLog('Adding link', { previousUrl })
      
      const url = window.prompt('Enter URL:', previousUrl)
      debugLog('URL entered', { url })
      
      if (url === null) {
        debugLog('Link cancelled')
        return
      }

      if (url === '') {
        debugLog('Removing link')
        editor?.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }

      debugLog('Setting link', { url })
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } catch (error) {
      debugLog('Error adding link', error)
      showNotification('error', 'Failed to add link')
    }
  }, [editor, debugLog])

  const handleImageUpload = useCallback(async (file: File) => {
    if (uploadingRef.current) {
      debugLog('Upload already in progress')
      return
    }
    
    try {
      uploadingRef.current = true
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
      editor?.chain().focus().setImage({ src: publicUrl }).run()
      
      showNotification('success', 'Image uploaded successfully')
    } catch (error: any) {
      debugLog('Image upload failed', error)
      showNotification('error', error.message || 'Failed to upload image')
    } finally {
      uploadingRef.current = false
    }
  }, [editor, debugLog])
  
  const addImageFromURL = useCallback(() => {
    try {
      debugLog('Adding image from URL')
      const url = window.prompt('Enter image URL:')
      debugLog('URL entered', { url })
      
      if (url) {
        // Validate URL
        try {
          new URL(url)
        } catch {
          throw new Error('Please enter a valid URL')
        }
        
        debugLog('Setting image with URL', { url })
        editor?.chain().focus().setImage({ src: url }).run()
      } else {
        debugLog('Image URL cancelled')
      }
    } catch (error: any) {
      debugLog('Error adding image from URL', error)
      showNotification('error', error.message || 'Failed to add image')
    }
  }, [editor, debugLog])
  
  const addImage = useCallback(() => {
    debugLog('Add image button clicked')
    
    // Show options: Upload or URL
    const choice = window.confirm('Click OK to upload an image from your computer,\nor Cancel to enter an image URL')
    
    if (choice) {
      debugLog('User chose to upload file')
      fileInputRef.current?.click()
    } else {
      debugLog('User chose to enter URL')
      addImageFromURL()
    }
  }, [addImageFromURL, debugLog])

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
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
            e.target.value = '' // Reset input
          }
        }}
      />
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Format Dropdown */}
        <select
          onChange={(e) => {
            const value = e.target.value
            editor.chain().focus().run()
            
            switch(value) {
              case 'paragraph':
                editor.chain().focus().setParagraph().run()
                break
              case 'h1':
                editor.chain().focus().setHeading({ level: 1 }).run()
                break
              case 'h2':
                editor.chain().focus().setHeading({ level: 2 }).run()
                break
              case 'h3':
                editor.chain().focus().setHeading({ level: 3 }).run()
                break
            }
          }}
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' :
            'paragraph'
          }
          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bold') ? 'bg-gray-200 text-primary-600' : 'hover:bg-gray-200'
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        
        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('italic') ? 'bg-gray-200 text-primary-600' : 'hover:bg-gray-200'
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        
        {/* Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('code') ? 'bg-gray-200 text-primary-600' : 'hover:bg-gray-200'
          }`}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bulletList') ? 'bg-gray-200 text-primary-600' : 'hover:bg-gray-200'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        
        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('orderedList') ? 'bg-gray-200 text-primary-600' : 'hover:bg-gray-200'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        
        {/* Quote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('blockquote') ? 'bg-gray-200 text-primary-600' : 'hover:bg-gray-200'
          }`}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        {/* Link */}
        <button
          type="button"
          onClick={addLink}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('link') ? 'bg-gray-200 text-primary-600' : 'hover:bg-gray-200'
          }`}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        
        {/* Image */}
        <button
          type="button"
          onClick={addImage}
          className="p-1.5 rounded transition-colors hover:bg-gray-200"
          title="Add Image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`p-1.5 rounded transition-colors ${
            !editor.can().undo() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
          }`}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        
        {/* Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`p-1.5 rounded transition-colors ${
            !editor.can().redo() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
          }`}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
      
      {/* Editor Content */}
      <div className="bg-white min-h-[200px] max-h-[400px] overflow-y-auto">
        <EditorContent 
          editor={editor}
          className="prose prose-sm max-w-none p-3 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px]"
        />
      </div>
      
      {/* Character count */}
      <div className="bg-gray-50 border-t border-gray-300 px-3 py-1 text-xs text-gray-600 flex justify-between">
        <span>{editor.storage.characterCount?.characters() || 0} characters</span>
        {placeholder && !editor.getText() && (
          <span className="italic">{placeholder}</span>
        )}
      </div>
    </div>
  )
}