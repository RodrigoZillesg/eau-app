import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/clearCache'

// In development, log cache clearing instructions
if (import.meta.env.DEV) {
  console.log('%c🔧 Development Mode', 'color: #4CAF50; font-weight: bold;')
  console.log('%cPress Ctrl+Shift+R to clear cache and reload', 'color: #2196F3;')
  console.log('%cIf experiencing loading issues, open DevTools > Application > Clear Storage', 'color: #FF9800;')
}

// Removed StrictMode to avoid double rendering issues
createRoot(document.getElementById('root')!).render(<App />)
