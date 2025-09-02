import { useState } from 'react'
import { QuillEditorSimple } from '../../../components/ui/QuillEditorSimple'
import { QuillContentFixed } from '../../../components/ui/QuillContentFixed'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

export function OverflowTestPage() {
  const [content, setContent] = useState('')
  
  const loadLongText = () => {
    setContent(`
      <h1>Testing Text Overflow</h1>
      <p>This is a normal paragraph with regular text that should wrap properly.</p>
      
      <h2>Long URL Test</h2>
      <p>Here's a very long URL that might cause overflow: https://www.example.com/very/long/path/that/continues/forever/and/ever/with/more/segments/and/parameters?param1=value1&param2=value2&param3=value3&param4=value4</p>
      
      <h2>Long Word Test</h2>
      <p>Supercalifragilisticexpialidociousantidisestablishmentarianismfloccinaucinihilipilificationpneumonoultramicroscopicsilicovolcanoconiosis</p>
      
      <h2>Long Continuous Text</h2>
      <p>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</p>
      
      <h2>Normal List</h2>
      <ul>
        <li>Normal bullet point</li>
        <li>Another normal bullet with a very long text that should wrap properly when it reaches the edge of the container</li>
        <li>Short bullet</li>
      </ul>
      
      <h2>List with Long Content</h2>
      <ul>
        <li>https://www.example.com/very/long/url/in/a/list/item/that/might/cause/overflow/problems/if/not/handled/properly</li>
        <li>Verylongwordwithoutanyspacesthatmightcauseoverflowissuesifnothandledproperlyintheeditor</li>
      </ul>
      
      <blockquote>
        This is a blockquote with a very long URL: https://www.example.com/another/very/long/path/in/a/blockquote/element/to/test/overflow/handling
      </blockquote>
    `)
  }
  
  const loadNormalText = () => {
    setContent(`
      <h1>Normal Content Example</h1>
      <p>This is a normal paragraph with regular content that should display nicely without any overflow issues.</p>
      
      <h2>Features List</h2>
      <ul>
        <li>First feature point</li>
        <li>Second feature with more details</li>
        <li>Third feature point</li>
      </ul>
      
      <p>Another paragraph with <strong>bold</strong>, <em>italic</em>, and <u>underlined</u> text.</p>
    `)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Text Overflow Test</h1>
      <p className="text-gray-600 mb-8">
        Test how the editor handles long text, URLs, and words that might cause overflow.
      </p>

      <div className="mb-4 space-x-2">
        <Button onClick={loadLongText}>Load Long/Problem Text</Button>
        <Button onClick={loadNormalText} variant="outline">Load Normal Text</Button>
        <Button onClick={() => setContent('')} variant="outline">Clear</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2 text-green-600">Editor (Should NOT overflow)</h2>
          <div className="border-2 border-red-500 p-1">
            <QuillEditorSimple
              content={content}
              onChange={setContent}
              height="400px"
              enableDebugLogs={false}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Red border shows the container boundary. Text should NOT go outside.
          </p>
        </Card>

        {/* Display */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2 text-blue-600">Display (Should also NOT overflow)</h2>
          <div className="border-2 border-red-500 p-4 overflow-hidden">
            <QuillContentFixed content={content} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Red border shows the container boundary. Text should wrap properly.
          </p>
        </Card>
      </div>

      {/* Instructions */}
      <div className="mt-8">
        <Card className="p-6 bg-yellow-50">
          <h3 className="font-semibold mb-2">What to Check:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Long URLs should wrap or be truncated</li>
            <li>Long words should break when necessary</li>
            <li>Continuous text without spaces should wrap</li>
            <li>All content should stay within the red borders</li>
            <li>Horizontal scrollbar should NOT appear</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}