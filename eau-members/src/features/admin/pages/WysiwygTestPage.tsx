import { useState } from 'react'
import { QuillEditorSimple } from '../../../components/ui/QuillEditorSimple'
import { QuillContentFixed } from '../../../components/ui/QuillContentFixed'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

export function WysiwygTestPage() {
  const [content, setContent] = useState(`
    <h1>WYSIWYG Test - What You See Is What You Get</h1>
    <p>This page demonstrates that the content looks exactly the same in the editor and when rendered.</p>
    
    <h2>Unordered List (Bullet Points)</h2>
    <ul>
      <li>First bullet point</li>
      <li>Second bullet point</li>
      <li>Third bullet point with nested items:
        <ul>
          <li>Nested item 1</li>
          <li>Nested item 2</li>
        </ul>
      </li>
    </ul>
    
    <h2>Ordered List (Numbers)</h2>
    <ol>
      <li>First numbered item</li>
      <li>Second numbered item</li>
      <li>Third numbered item</li>
    </ol>
    
    <blockquote>This is a blockquote. It should look the same in both views.</blockquote>
    
    <p><strong>Bold text</strong>, <em>italic text</em>, and <u>underlined text</u>.</p>
  `)

  const [editMode, setEditMode] = useState(true)

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">WYSIWYG Test - Editor vs Display</h1>
      <p className="text-gray-600 mb-8">
        This page shows that content looks identical in the editor and when displayed to users.
      </p>

      <div className="mb-4">
        <Button
          onClick={() => setEditMode(!editMode)}
          variant={editMode ? 'primary' : 'outline'}
        >
          {editMode ? 'Switch to Display Mode' : 'Switch to Edit Mode'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor View */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            Editor View (What Admin Sees)
          </h2>
          <div className={editMode ? '' : 'opacity-50 pointer-events-none'}>
            <QuillEditorSimple
              content={content}
              onChange={setContent}
              placeholder="Start typing..."
              height="400px"
              enableDebugLogs={false}
            />
          </div>
        </Card>

        {/* Display View */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">
            Display View (What Users See)
          </h2>
          <div className="border border-gray-200 rounded-lg p-4 min-h-[400px]">
            <QuillContentFixed content={content} />
          </div>
        </Card>
      </div>

      {/* Full Width Comparison */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Full Width Display (Event Details Page)
          </h2>
          <div className="border-t pt-4">
            <QuillContentFixed content={content} />
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <div className="mt-8">
        <Card className="p-6 bg-blue-50">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Edit content in the left panel (Editor View)</li>
            <li>See real-time updates in the right panel (Display View)</li>
            <li>Toggle between edit and display modes with the button</li>
            <li>Notice that bullet points remain as bullets (not numbers)</li>
            <li>All formatting looks identical in both views</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}