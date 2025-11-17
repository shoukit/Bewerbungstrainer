import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Initialize React app when DOM is ready
function initReactApp() {
  // Support both WordPress and standalone mode
  const rootElement = document.getElementById('bewerbungstrainer-app') || document.getElementById('root');

  if (rootElement) {
    console.log('✅ Bewerbungstrainer: Mounting React app on:', rootElement.id);
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } else {
    console.error('❌ Bewerbungstrainer: Root element not found! Looking for #bewerbungstrainer-app or #root');
    console.log('Available elements:', document.body.innerHTML.substring(0, 500));
  }
}

// Wait for DOM to be ready before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReactApp);
} else {
  // DOM is already ready
  initReactApp();
}
