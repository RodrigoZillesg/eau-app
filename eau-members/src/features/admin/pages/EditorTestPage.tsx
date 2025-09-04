import { useState } from 'react'
import { QuillEditor } from '../../../components/ui/QuillEditor'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { showNotification } from '../../../lib/notifications'

export function EditorTestPage() {
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const handleSave = () => {
    setSavedContent(content)
    showNotification('success', 'Content saved successfully')
    console.log('Saved content:', content)
  }

  const handleClear = () => {
    setContent('')
    setSavedContent('')
    showNotification('info', 'Content cleared')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Rich Text Editor Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Section */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quill Editor</h2>
            
            <QuillEditor
              content={content}
              onChange={setContent}
              placeholder="Start typing or paste an image..."
              height="300px"
              enableDebugLogs={true}
            />
            
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave}>
                Save Content
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>
            
            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Rich text formatting (bold, italic, underline, etc.)</li>
                <li>Headers and lists</li>
                <li>Image upload from computer (click image button)</li>
                <li>Paste images directly (Ctrl+V)</li>
                <li>Links and videos</li>
                <li>Color and background formatting</li>
                <li>All changes are logged in the console (F12)</li>
              </ul>
            </div>
          </Card>
        </div>
        
        {/* Output Section */}
        <div>
          {/* Live HTML Output */}
          <Card className="p-6 mb-4">
            <h2 className="text-xl font-semibold mb-4">Raw HTML Output</h2>
            <div className="bg-gray-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
              <pre>{content || '<empty>'}</pre>
            </div>
          </Card>
          
          {/* Preview */}
          {showPreview && (
            <Card className="p-6 mb-4">
              <h2 className="text-xl font-semibold mb-4">Rendered Preview</h2>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">No content to preview</p>' }}
              />
            </Card>
          )}
          
          {/* Saved Content */}
          {savedContent && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Last Saved Content</h2>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: savedContent }}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}