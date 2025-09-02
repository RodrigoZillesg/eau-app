export function ForcedBulletTest() {
  // Test HTML with UL/LI
  const testHtml = `
    <p>Paragraph before list</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
    <p>Paragraph after list</p>
  `;

  // HTML converted to DIVs
  const convertedHtml = testHtml
    .replace(/<ul>/g, '<div class="forced-bullet-list">')
    .replace(/<\/ul>/g, '</div>')
    .replace(/<li>/g, '<div class="forced-bullet-item">')
    .replace(/<\/li>/g, '</div>');

  return (
    <div className="p-6 space-y-8 bg-white border rounded">
      <h2 className="text-2xl font-bold">Forced Bullet Test - Step by Step</h2>
      
      {/* Step 1: Show raw HTML */}
      <div className="border-2 border-red-200 p-4 rounded">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Step 1: Raw HTML (problematic)</h3>
        <pre className="text-xs bg-gray-100 p-2 rounded mb-2">{testHtml}</pre>
        <div 
          className="border p-3 bg-red-50"
          dangerouslySetInnerHTML={{ __html: testHtml }}
        />
        <p className="text-sm text-red-600 mt-2">↑ This probably shows numbers instead of bullets</p>
      </div>

      {/* Step 2: Show converted HTML */}
      <div className="border-2 border-blue-200 p-4 rounded">
        <h3 className="text-lg font-semibold text-blue-700 mb-2">Step 2: Converted HTML (should work)</h3>
        <pre className="text-xs bg-gray-100 p-2 rounded mb-2">{convertedHtml}</pre>
        <div 
          className="border p-3 bg-blue-50"
          dangerouslySetInnerHTML={{ __html: convertedHtml }}
        />
        <p className="text-sm text-blue-600 mt-2">↑ This should show bullet points (•)</p>
      </div>

      {/* Step 3: Manual HTML */}
      <div className="border-2 border-green-200 p-4 rounded">
        <h3 className="text-lg font-semibold text-green-700 mb-2">Step 3: Manual HTML (guaranteed to work)</h3>
        <div className="border p-3 bg-green-50">
          <p>Paragraph before list</p>
          <div className="forced-bullet-list">
            <div className="forced-bullet-item">Manual Item 1</div>
            <div className="forced-bullet-item">Manual Item 2</div>
            <div className="forced-bullet-item">Manual Item 3</div>
          </div>
          <p>Paragraph after list</p>
        </div>
        <p className="text-sm text-green-600 mt-2">↑ This is manually coded and MUST work</p>
      </div>

      {/* CSS Check */}
      <div className="border-2 border-purple-200 p-4 rounded">
        <h3 className="text-lg font-semibold text-purple-700 mb-2">Step 4: CSS Debug</h3>
        <p className="text-sm mb-2">Check browser DevTools for these styles:</p>
        <pre className="text-xs bg-purple-50 p-2 rounded">
{`.forced-bullet-list { margin: 0.5em 0; padding-left: 0; }
.forced-bullet-item { position: relative; padding-left: 1.5em; margin: 0.25em 0; }
.forced-bullet-item::before { content: "•"; position: absolute; left: 0; }`}
        </pre>
      </div>

      <style>{`
        .forced-bullet-list {
          margin: 0.5em 0 !important;
          padding-left: 0 !important;
        }
        
        .forced-bullet-item {
          position: relative !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
          display: block !important;
        }
        
        .forced-bullet-item::before {
          content: "•" !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          color: currentColor !important;
          font-weight: bold !important;
          display: inline-block !important;
          width: 1em !important;
          font-size: 1em !important;
        }
        
        /* Force hide any potential markers on UL/LI */
        ul {
          list-style: none !important;
          list-style-type: none !important;
        }
        
        ul li {
          list-style: none !important;
          list-style-type: none !important;
        }
        
        ul li::marker {
          display: none !important;
          content: none !important;
          visibility: hidden !important;
        }
        
        ul li::before {
          content: "•" !important;
          position: absolute !important;
          left: 0 !important;
          color: red !important;
          font-weight: bold !important;
        }
      `}</style>
    </div>
  );
}