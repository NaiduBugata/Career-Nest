import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Remove the preloader (if present) after React has mounted
try {
  const pre = document.getElementById('preloader')
  if (pre) {
    // slight delay to ensure users see the loader for very fast loads too
    setTimeout(() => pre.remove(), 80)
  }
} catch (e) {
  // ignore
}
