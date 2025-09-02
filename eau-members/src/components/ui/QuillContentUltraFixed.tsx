import 'quill/dist/quill.snow.css'

interface QuillContentUltraFixedProps {
  content: string
  className?: string
}

/**
 * ULTRA FIXED version - converts <li> to <div> to completely bypass ::marker
 */
export function QuillContentUltraFixed({ content, className = '' }: QuillContentUltraFixedProps) {
  // Don't replace anymore - just use the content as is since we'll fix with CSS
  const processedContent = content;

  return (
    <>
      <div 
        className={`ql-container ql-snow ${className}`}
        style={{ border: 'none' }}
      >
        <div 
          className="ql-editor"
          style={{ 
            padding: 0,
            minHeight: 'auto',
            fontSize: '16px',
            lineHeight: '1.6'
          }}
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </div>
      
      <style>{`
        /* FIX FOR FRONT-END DISPLAY - Same logic as editor */
        
        /* BULLETS - Use native ::marker */
        .ql-editor ul {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }
        
        .ql-editor ul li {
          list-style-type: disc !important;
          display: list-item !important;
        }
        
        .ql-editor li[data-list="bullet"] {
          list-style-type: disc !important;
          display: list-item !important;
        }
        
        /* Hide Quill's UI elements in rendered content */
        .ql-editor li > .ql-ui {
          display: none !important;
        }
        
        .ql-editor li > .ql-ui::before {
          content: none !important;
          display: none !important;
        }
        
        /* ORDERED LISTS - Use native numbering */
        .ql-editor ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
          counter-reset: none !important;
        }
        
        .ql-editor ol li {
          list-style-type: decimal !important;
          display: list-item !important;
        }
        
        .ql-editor li[data-list="ordered"] {
          list-style-type: decimal !important;
          display: list-item !important;
        }
        
        /* Remove any Quill counter increments */
        .ql-editor li[data-list] {
          counter-increment: none !important;
        }
        
        /* Spacing adjustments */
        .ql-editor h1 {
          margin: 0.5em 0 !important;
          font-size: 2em !important;
        }
        
        .ql-editor h2 {
          margin: 0.5em 0 !important;
          font-size: 1.5em !important;
        }
        
        .ql-editor h3 {
          margin: 0.5em 0 !important;
          font-size: 1.17em !important;
        }
        
        .ql-editor p {
          margin: 0.5em 0 !important;
        }
        
        .ql-editor p:first-child {
          margin-top: 0 !important;
        }
        
        .ql-editor p:last-child {
          margin-bottom: 0 !important;
        }
        
        .ql-editor blockquote {
          margin: 0.5em 0 !important;
          padding-left: 1em !important;
        }
        
        /* Keep numbered lists as normal */
        .ql-editor ol {
          list-style-type: decimal !important;
          display: block !important;
          margin: 0.5em 0 !important;
          padding-left: 1.5em !important;
        }
        
        .ql-editor ol > li {
          list-style-type: decimal !important;
          display: list-item !important;
          margin: 0.25em 0 !important;
        }
      `}</style>
    </>
  )
}