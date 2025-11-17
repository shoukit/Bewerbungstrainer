import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Keep track of whether we've already mounted to prevent double mounting
let hasAlreadyMounted = false;

// Initialize React app when DOM is ready
function initReactApp() {
  // Prevent double mounting
  if (hasAlreadyMounted) {
    console.log('⚠️ Bewerbungstrainer: App already mounted, skipping...');
    return;
  }

  // Support both WordPress and standalone mode
  const rootElement = document.getElementById('bewerbungstrainer-app') || document.getElementById('root');

  if (!rootElement) {
    console.error('❌ Bewerbungstrainer: Root element not found! Looking for #bewerbungstrainer-app or #root');
    console.log('Document ready state:', document.readyState);
    console.log('Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    return;
  }

  // Check if element already has React root
  if (rootElement._reactRootContainer || rootElement._reactRoot) {
    console.warn('⚠️ Bewerbungstrainer: Root element already has a React root, clearing...');
    rootElement.innerHTML = '';
  }

  try {
    console.log('✅ Bewerbungstrainer: Mounting React app on:', rootElement.id);
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    hasAlreadyMounted = true;
    console.log('✅ Bewerbungstrainer: React app mounted successfully');
  } catch (error) {
    console.error('❌ Bewerbungstrainer: Failed to mount React app:', error);
  }
}

// WordPress compatibility: Use multiple strategies to ensure DOM is ready
function waitForDOMAndMount() {
  // Strategy 1: If element is already available, mount immediately
  if (document.getElementById('bewerbungstrainer-app') || document.getElementById('root')) {
    console.log('✅ Bewerbungstrainer: Element found immediately, mounting...');
    initReactApp();
    return;
  }

  // Strategy 2: Wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    console.log('⏳ Bewerbungstrainer: Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initReactApp);
  } else {
    // Strategy 3: DOM is already loaded, but element might not be rendered yet
    // Wait a bit for WordPress/page builders to render the shortcode
    console.log('⏳ Bewerbungstrainer: DOM loaded, waiting for element...');

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const checkInterval = setInterval(() => {
      attempts++;

      if (document.getElementById('bewerbungstrainer-app') || document.getElementById('root')) {
        clearInterval(checkInterval);
        console.log(`✅ Bewerbungstrainer: Element found after ${attempts * 100}ms`);
        initReactApp();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('❌ Bewerbungstrainer: Element not found after 5 seconds');
        console.log('Available elements:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
      }
    }, 100);
  }
}

// Start the mounting process
waitForDOMAndMount();
