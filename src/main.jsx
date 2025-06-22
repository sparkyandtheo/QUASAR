import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './App.jsx' // <-- MODIFIED: Import Root instead of App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root /> {/* <-- MODIFIED: Render Root */}
  </StrictMode>,
)
