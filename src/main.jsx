import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🚀 [MAIN] Script loaded - starting initialization');

// Keep track of whether we've already mounted to prevent double mounting
let hasAlreadyMounted = false;
let reactRoot = null;

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
    return;
  }

  // Check if element already has React root - skip re-mounting
  if (rootElement._reactRootContainer || rootElement.__reactRoot || reactRoot) {
    console.warn('⚠️ Bewerbungstrainer: Root element already has a React root, skipping re-mount...');
    hasAlreadyMounted = true;
    return;
  }

  try {
    console.log('✅ Bewerbungstrainer: Mounting React app on:', rootElement.id);

    // Clear loading content safely
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }

    reactRoot = createRoot(rootElement);
    reactRoot.render(
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
  // Use requestAnimationFrame to ensure we're not blocking the main thread
  // and give other scripts time to initialize
  const safeMount = () => {
    requestAnimationFrame(() => {
      try {
        initReactApp();
      } catch (error) {
        console.error('❌ Bewerbungstrainer: Error during mount:', error);
      }
    });
  };

  // Strategy 1: If element is already available, mount after a small delay
  if (document.getElementById('bewerbungstrainer-app') || document.getElementById('root')) {
    console.log('✅ Bewerbungstrainer: Element found immediately, scheduling mount...');
    // Small delay to let other scripts initialize first
    setTimeout(safeMount, 50);
    return;
  }

  // Strategy 2: Wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    console.log('⏳ Bewerbungstrainer: Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => setTimeout(safeMount, 50));
  } else {
    // Strategy 3: DOM is already loaded, but element might not be rendered yet
    console.log('⏳ Bewerbungstrainer: DOM loaded, waiting for element...');

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const checkInterval = setInterval(() => {
      attempts++;

      if (document.getElementById('bewerbungstrainer-app') || document.getElementById('root')) {
        clearInterval(checkInterval);
        console.log(`✅ Bewerbungstrainer: Element found after ${attempts * 100}ms`);
        setTimeout(safeMount, 50);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('❌ Bewerbungstrainer: Element not found after 5 seconds');
      }
    }, 100);
  }
}

// Start the mounting process
waitForDOMAndMount();
