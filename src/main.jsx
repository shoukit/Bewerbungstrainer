import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Support both WordPress and standalone mode
const rootElement = document.getElementById('bewerbungstrainer-app') || document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  console.error('Bewerbungstrainer: Root element not found! Looking for #bewerbungstrainer-app or #root');
}
