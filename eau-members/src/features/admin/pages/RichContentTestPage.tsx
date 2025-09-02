import { Card } from '../../../components/ui/Card'
import '../../../styles/rich-content.css'

export function RichContentTestPage() {
  const sampleContent = `
    <h1>Heading 1 - Main Title</h1>
    <p>This is a regular paragraph with some <strong>bold text</strong>, <em>italic text</em>, and <u>underlined text</u>. You can also have <s>strikethrough text</s>.</p>
    
    <h2>Heading 2 - Section Title</h2>
    <p>Here's another paragraph demonstrating text formatting. You can combine <strong><em>bold and italic</em></strong> or any other combination.</p>
    
    <h3>Heading 3 - Subsection</h3>
    <p>Let's demonstrate lists. Here's an unordered list:</p>
    <ul>
      <li>First item in the list</li>
      <li>Second item with <strong>bold text</strong></li>
      <li>Third item with nested list:
        <ul>
          <li>Nested item 1</li>
          <li>Nested item 2</li>
          <li>Nested item 3 with another level:
            <ul>
              <li>Deep nested item</li>
            </ul>
          </li>
        </ul>
      </li>
      <li>Fourth item back at main level</li>
    </ul>
    
    <h3>Ordered Lists</h3>
    <p>Now let's see an ordered list:</p>
    <ol>
      <li>First step in the process</li>
      <li>Second step with more details</li>
      <li>Third step with sub-steps:
        <ol>
          <li>Sub-step A</li>
          <li>Sub-step B</li>
          <li>Sub-step C</li>
        </ol>
      </li>
      <li>Final step</li>
    </ol>
    
    <h2>Blockquotes and Code</h2>
    <blockquote>
      "This is a blockquote. It's typically used for quotes or to highlight important information. It can span multiple lines and should be visually distinct from regular text."
    </blockquote>
    
    <p>Here's some inline code: <code>const example = "Hello World";</code> within a paragraph.</p>
    
    <pre><code>// Code block example
function greet(name) {
  return \`Hello, \${name}!\`;
}

const message = greet("Developer");
console.log(message);</code></pre>
    
    <h2>Links and Text Alignment</h2>
    <p>You can add <a href="https://example.com" target="_blank">links to external sites</a> or internal pages.</p>
    
    <p class="ql-align-center">This text is centered using Quill's alignment class.</p>
    
    <p class="ql-align-right">This text is right-aligned.</p>
    
    <p class="ql-align-justify">This is a justified paragraph. When text is justified, it is aligned along both the left and right margins. This creates a clean, formal appearance that's often used in printed materials like newspapers and books. The spacing between words is adjusted to achieve this alignment.</p>
    
    <h2>Indentation</h2>
    <p>Regular paragraph without indentation.</p>
    <p class="ql-indent-1">This paragraph has level 1 indentation.</p>
    <p class="ql-indent-2">This paragraph has level 2 indentation.</p>
    <p class="ql-indent-3">This paragraph has level 3 indentation.</p>
    
    <hr>
    
    <h2>Mixed Content Example</h2>
    <p>Let's combine everything in a real-world example:</p>
    
    <h3>Workshop Agenda</h3>
    <ol>
      <li><strong>9:00 AM - Introduction</strong>
        <ul>
          <li>Welcome and overview</li>
          <li>Participant introductions</li>
        </ul>
      </li>
      <li><strong>9:30 AM - Theory Session</strong>
        <ul>
          <li>Core concepts</li>
          <li>Best practices</li>
          <li>Case studies</li>
        </ul>
      </li>
      <li><strong>11:00 AM - Practical Exercise</strong>
        <blockquote>
          "Learning by doing is the most effective way to master new skills."
        </blockquote>
      </li>
      <li><strong>12:00 PM - Lunch Break</strong></li>
      <li><strong>1:00 PM - Advanced Topics</strong>
        <ul>
          <li>Complex scenarios</li>
          <li>Troubleshooting tips</li>
        </ul>
      </li>
    </ol>
    
    <p><em>Note: All times are in AEDT (Australian Eastern Daylight Time)</em></p>
  `

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Rich Content Styles Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Raw HTML */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Raw HTML (from Quill)</h2>
            <div className="bg-gray-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
              <pre>{sampleContent}</pre>
            </div>
          </Card>
        </div>
        
        {/* Rendered Content */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Rendered Content</h2>
            <div 
              className="rich-content"
              dangerouslySetInnerHTML={{ __html: sampleContent }}
            />
          </Card>
        </div>
      </div>
      
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Full Width Rendered Content</h2>
          <div 
            className="rich-content"
            dangerouslySetInnerHTML={{ __html: sampleContent }}
          />
        </Card>
      </div>
    </div>
  )
}