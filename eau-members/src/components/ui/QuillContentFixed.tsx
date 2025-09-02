import 'quill/dist/quill.snow.css'

interface QuillContentFixedProps {
  content: string
  className?: string
}

/**
 * Fixed version of QuillContent that ensures bullets show as bullets
 */
export function QuillContentFixed({ content, className = '' }: QuillContentFixedProps) {
  // Process the HTML content to add inline styles to force bullets
  const processedContent = content.replace(
    /<ul>/g, 
    '<ul style="list-style:none!important;list-style-type:none!important;margin:0.5em 0!important;padding-left:0!important;">'
  ).replace(
    /<li>/g,
    '<li style="list-style:none!important;list-style-type:none!important;position:relative!important;padding-left:1.5em!important;margin:0.25em 0!important;display:block!important;">'
  );

  return (
    <>
      <div 
        className={`ql-container ql-snow ${className}`}
        style={{ border: 'none' }}
      >
        <div 
          className="ql-editor bullets-fixed"
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
        /* SUPER SPECIFIC FIX: Custom bullets for bullets-fixed class */
        .bullets-fixed ul li::before {
          content: "•" !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          color: currentColor !important;
          font-weight: bold !important;
          display: inline-block !important;
          width: 1em !important;
          height: 1em !important;
          line-height: 1 !important;
          z-index: 1 !important;
        }
        
        /* Hide ALL possible markers */
        .bullets-fixed ul li::marker {
          content: none !important;
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        
        .bullets-fixed ul li::-webkit-details-marker {
          display: none !important;
        }
        
        .bullets-fixed ul li {
          list-style: none !important;
          list-style-type: none !important;
          list-style-image: none !important;
          counter-increment: none !important;
        }
        
        .bullets-fixed ul {
          list-style: none !important;
          list-style-type: none !important;
          list-style-image: none !important;
          counter-reset: none !important;
        }
        
        /* Force override any external styles */
        [data-list] {
          list-style: none !important;
        }
        
        [data-list="bullet"] {
          list-style: none !important;
        }
        
        [data-list="bullet"]::marker {
          display: none !important;
        }
        
        [data-list="bullet"]::before {
          content: "•" !important;
          position: absolute !important;
          left: 0 !important;
        }
        
        .ql-editor ul > li[data-list] {
          list-style-type: disc !important;
        }
        
        .ql-editor ul > li[data-list="bullet"] {
          list-style-type: disc !important;
        }
        
        .ql-editor ul ul {
          list-style-type: circle !important;
        }
        
        .ql-editor ul ul ul {
          list-style-type: square !important;
        }
        
        .ql-editor ol {
          list-style-type: decimal !important;
          display: block !important;
          margin-block-start: 0.5em !important;
          margin-block-end: 0.5em !important;
          padding-inline-start: 1.5em !important;
        }
        
        .ql-editor ol > li {
          list-style-type: decimal !important;
          display: list-item !important;
          margin: 0.25em 0 !important;
        }
        
        .ql-editor ol > li::before {
          display: none !important;
          content: none !important;
        }
        
        .ql-editor ol > li[data-list] {
          list-style-type: decimal !important;
        }
        
        .ql-editor ol > li[data-list="ordered"] {
          list-style-type: decimal !important;
        }
        
        /* Counter reset for any Quill counters */
        .ql-editor {
          counter-reset: none !important;
        }
        
        .ql-editor li {
          counter-increment: none !important;
        }
        
        .ql-editor li:before {
          content: none !important;
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
        
        /* Remove any Quill-specific list indentation classes */
        .ql-editor .ql-indent-1 { padding-left: 3em !important; }
        .ql-editor .ql-indent-2 { padding-left: 6em !important; }
        .ql-editor .ql-indent-3 { padding-left: 9em !important; }
        .ql-editor .ql-indent-4 { padding-left: 12em !important; }
        .ql-editor .ql-indent-5 { padding-left: 15em !important; }
        .ql-editor .ql-indent-6 { padding-left: 18em !important; }
        .ql-editor .ql-indent-7 { padding-left: 21em !important; }
        .ql-editor .ql-indent-8 { padding-left: 24em !important; }
      `}</style>
    </>
  )
}