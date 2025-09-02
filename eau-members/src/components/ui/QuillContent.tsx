import 'quill/dist/quill.snow.css'
import './QuillContent.css'

interface QuillContentProps {
  content: string
  className?: string
}

/**
 * Component to render Quill HTML content with the same styles as the editor
 * This ensures WYSIWYG - What You See Is What You Get
 */
export function QuillContent({ content, className = '' }: QuillContentProps) {
  return (
    <div 
      className={`ql-editor ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}