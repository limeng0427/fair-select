import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import Privacy from './Privacy.jsx'
import Terms from './Terms.jsx'

const path = window.location.pathname

let Root
if (path === '/privacy') {
  Root = Privacy
} else if (path === '/terms') {
  Root = Terms
} else {
  Root = App
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
