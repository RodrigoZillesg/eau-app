export function BulletTestComponent() {
  const testContent = `
    <p>Normal paragraph</p>
    <ul>
      <li>First bullet point</li>
      <li>Second bullet point</li>  
      <li>Third bullet point</li>
    </ul>
    <p>Another paragraph</p>
  `;

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-4">Bullet Test Component</h3>
      
      {/* Test 1: Raw HTML with minimal styling */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm">Test 1: Raw HTML</h4>
        <div 
          className="border p-2 bg-gray-50"
          dangerouslySetInnerHTML={{ __html: testContent }}
        />
      </div>

      {/* Test 2: With our bullets-fixed class */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm">Test 2: bullets-fixed class</h4>
        <div 
          className="bullets-fixed border p-2 bg-blue-50"
          dangerouslySetInnerHTML={{ __html: testContent }}
        />
      </div>

      {/* Test 3: Completely forced inline styles */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm">Test 3: Forced inline styles</h4>
        <div className="border p-2 bg-green-50">
          <p>Normal paragraph</p>
          <ul style={{
            listStyle: 'none',
            listStyleType: 'none',
            paddingLeft: 0,
            margin: '0.5em 0'
          }}>
            <li style={{
              listStyle: 'none',
              listStyleType: 'none',
              position: 'relative',
              paddingLeft: '1.5em',
              margin: '0.25em 0',
              display: 'block'
            }}>
              <span style={{
                position: 'absolute',
                left: 0,
                top: 0,
                fontWeight: 'bold'
              }}>•</span>
              First forced bullet
            </li>
            <li style={{
              listStyle: 'none',
              listStyleType: 'none',
              position: 'relative',
              paddingLeft: '1.5em',
              margin: '0.25em 0',
              display: 'block'
            }}>
              <span style={{
                position: 'absolute',
                left: 0,
                top: 0,
                fontWeight: 'bold'
              }}>•</span>
              Second forced bullet
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        .bullets-fixed ul {
          list-style: none !important;
          list-style-type: none !important;
          padding-left: 0 !important;
          margin: 0.5em 0 !important;
        }
        
        .bullets-fixed ul li {
          list-style: none !important;
          list-style-type: none !important;
          position: relative !important;
          padding-left: 1.5em !important;
          margin: 0.25em 0 !important;
          display: block !important;
        }
        
        .bullets-fixed ul li::before {
          content: "•" !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          font-weight: bold !important;
          color: currentColor !important;
        }
        
        .bullets-fixed ul li::marker {
          display: none !important;
          content: none !important;
          visibility: hidden !important;
        }
      `}</style>
    </div>
  );
}