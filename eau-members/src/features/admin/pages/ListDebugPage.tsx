import { useState, useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { BulletTestComponent } from '../../../components/ui/BulletTestComponent'
import { QuillContentUltraFixed } from '../../../components/ui/QuillContentUltraFixed'
import { ForcedBulletTest } from '../../../components/ui/ForcedBulletTest'

export function ListDebugPage() {
  const [content, setContent] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  
  useEffect(() => {
    if (!editorRef.current || quillRef.current) return
    
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: 'Type something and click the bullet list button...',
      modules: {
        toolbar: [
          ['bold', 'italic'],
          [{ 'list': 'bullet' }, { 'list': 'ordered' }],
          ['clean']
        ]
      }
    })
    
    quill.on('text-change', () => {
      const html = quill.root.innerHTML
      console.log('HTML generated:', html)
      setContent(html)
    })
    
    quillRef.current = quill
  }, [])
  
  const createBulletList = () => {
    if (quillRef.current) {
      quillRef.current.root.innerHTML = `
        <p>Before list</p>
        <ul>
          <li>First bullet point</li>
          <li>Second bullet point</li>
          <li>Third bullet point</li>
        </ul>
        <p>After list</p>
      `
      setContent(quillRef.current.root.innerHTML)
    }
  }
  
  const createNumberedList = () => {
    if (quillRef.current) {
      quillRef.current.root.innerHTML = `
        <p>Before list</p>
        <ol>
          <li>First numbered item</li>
          <li>Second numbered item</li>
          <li>Third numbered item</li>
        </ol>
        <p>After list</p>
      `
      setContent(quillRef.current.root.innerHTML)
    }
  }
  
  const checkListType = () => {
    if (quillRef.current) {
      const selection = quillRef.current.getSelection()
      if (selection) {
        const [line] = quillRef.current.getLine(selection.index)
        const formats = quillRef.current.getFormat(selection)
        console.log('Current formats:', formats)
        console.log('Current line:', line)
      }
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">List Debug Tool</h1>
      
      {/* PRIORITY: Forced Bullet Test - THIS MUST WORK */}
      <ForcedBulletTest />
      
      {/* Add Bullet Test Component */}
      <BulletTestComponent />
      
      <div className="my-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Quill Editor Test</h2>
      </div>
      
      <div className="mb-4 space-x-2">
        <Button onClick={createBulletList}>Insert Bullet List</Button>
        <Button onClick={createNumberedList}>Insert Numbered List</Button>
        <Button onClick={() => setContent('')} variant="outline">Clear</Button>
        <Button onClick={checkListType} variant="outline">Check Current Format</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">1. Quill Editor</h2>
          <p className="text-sm text-gray-600 mb-2">
            Try clicking the bullet list button (•) in the toolbar
          </p>
          <div 
            ref={editorRef}
            style={{ height: '300px' }}
            className="bg-white"
          />
        </Card>

        {/* Raw HTML */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">2. Raw HTML Output</h2>
          <div className="bg-gray-900 text-green-400 p-2 rounded font-mono text-xs overflow-auto h-[300px]">
            <pre>{content || '(empty)'}</pre>
          </div>
          <div className="mt-2 text-xs">
            <p className="text-blue-600">Look for: &lt;ul&gt; = bullets</p>
            <p className="text-orange-600">Look for: &lt;ol&gt; = numbers</p>
          </div>
        </Card>

        {/* Rendered Result */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">3. Browser Rendering</h2>
          <div 
            className="rendered-content border p-4 rounded min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Card>
      </div>

      {/* Add QuillContentUltraFixed test */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">QuillContentUltraFixed Test</h2>
          {content && (
            <div className="border p-4 rounded bg-yellow-50">
              <h3 className="font-semibold text-sm mb-2">Using QuillContentUltraFixed Component:</h3>
              <QuillContentUltraFixed content={content} />
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-6">
        {/* Manual Test */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Direct HTML Conversion Test</h2>
          <div className="bg-green-50 border p-4 rounded">
            <div className="custom-bullet-list">
              <div className="custom-bullet-item">First bullet converted to div</div>
              <div className="custom-bullet-item">Second bullet converted to div</div>
              <div className="custom-bullet-item">Third bullet converted to div</div>
            </div>
          </div>
          <style>{`
            .custom-bullet-list {
              margin: 0.5em 0 !important;
              padding-left: 0 !important;
            }
            
            .custom-bullet-item {
              position: relative !important;
              padding-left: 1.5em !important;
              margin: 0.25em 0 !important;
              display: block !important;
            }
            
            .custom-bullet-item::before {
              content: "•" !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              color: currentColor !important;
              font-weight: bold !important;
              display: inline-block !important;
              width: 1em !important;
            }
          `}</style>
        </Card>
      </div>

      {/* What's happening */}
      <Card className="p-6 mt-8">
        <h2 className="text-lg font-semibold mb-4">What Should Happen:</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-blue-600">Bullet List Button (•)</h3>
            <ul className="list-disc list-inside mt-2">
              <li>Should create &lt;ul&gt; tags</li>
              <li>Should show bullet points</li>
              <li>HTML should contain &lt;ul&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ul&gt;</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-orange-600">Numbered List Button (1.)</h3>
            <ul className="list-disc list-inside mt-2">
              <li>Should create &lt;ol&gt; tags</li>
              <li>Should show numbers (1, 2, 3...)</li>
              <li>HTML should contain &lt;ol&gt;&lt;li&gt;...&lt;/li&gt;&lt;/ol&gt;</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* CSS Check */}
      <Card className="p-6 mt-4 bg-yellow-50">
        <h2 className="text-lg font-semibold mb-2">CSS Interference Check:</h2>
        <div className="space-y-2">
          <div>
            <p className="font-semibold">Raw UL (should show bullets):</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Raw OL (should show numbers):</p>
            <ol>
              <li>Item 1</li>
              <li>Item 2</li>
            </ol>
          </div>
        </div>
      </Card>
      
      {/* CSS Fix for rendering - Custom bullets to bypass ::marker */}
      <style>{`
        /* Disable native list styles completely */
        .rendered-content ul {
          list-style: none !important;
          list-style-type: none !important;
          padding-left: 0 !important;
          margin: 0.5em 0 !important;
        }
        
        .rendered-content ul li {
          list-style: none !important;
          list-style-type: none !important;
          display: block !important;
          position: relative !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
        }
        
        /* Create custom bullet with ::before */
        .rendered-content ul li::before {
          content: "•" !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          color: inherit !important;
          font-weight: bold !important;
          display: inline-block !important;
          width: 1em !important;
        }
        
        /* Hide native ::marker completely */
        .rendered-content ul li::marker {
          content: none !important;
          display: none !important;
        }
        
        /* Nested bullets */
        .rendered-content ul ul li::before {
          content: "○" !important;
        }
        
        .rendered-content ul ul ul li::before {
          content: "▪" !important;
        }
        
        /* OL keeps normal behavior */
        .rendered-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }
        
        .rendered-content ol li {
          display: list-item !important;
          list-style-type: decimal !important;
          margin: 0.25em 0 !important;
        }
        
        .rendered-content ol li::before {
          content: none !important;
          display: none !important;
        }
      `}</style>
    </div>
  )
}