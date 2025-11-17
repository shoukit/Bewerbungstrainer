import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Keep track of whether we've already mounted to prevent double mounting
let hasAlreadyMounted = false;
let reactRoot = null;
let currentRootElement = null;
let domObserver = null;

/**
 * Start observing DOM changes to detect if the root element gets removed or modified
 * This helps handle WordPress page builders and dynamic content that might remove/re-add the element
 */
function startDOMObserver() {
  // Disconnect any existing observer
  if (domObserver) {
    domObserver.disconnect();
  }

  // Create a new observer
  domObserver = new MutationObserver((mutations) => {
    // Check if our root element still exists in the DOM
    const rootElement = document.getElementById('bewerbungstrainer-app') || document.getElementById('root');

    if (!rootElement || !document.body.contains(rootElement)) {
      console.warn('⚠️ Bewerbungstrainer: Root element was removed from DOM');

      // Reset mounted flag so we can remount if the element comes back
      hasAlreadyMounted = false;
      reactRoot = null;
      currentRootElement = null;

      // Disconnect observer
      if (domObserver) {
        domObserver.disconnect();
        domObserver = null;
      }

      // Try to remount after a short delay
      setTimeout(() => {
        console.log('🔄 Bewerbungstrainer: Attempting to remount...');
        waitForDOMAndMount();
      }, 100);
    } else if (rootElement !== currentRootElement) {
      // Element was replaced - remount
      console.warn('⚠️ Bewerbungstrainer: Root element was replaced');
      hasAlreadyMounted = false;
      reactRoot = null;
      currentRootElement = null;

      if (domObserver) {
        domObserver.disconnect();
        domObserver = null;
      }

      setTimeout(() => {
        console.log('🔄 Bewerbungstrainer: Attempting to remount on new element...');
        initReactApp();
      }, 100);
    }
  });

  // Start observing the entire document for changes
  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('👁️ Bewerbungstrainer: Started DOM observer');
}

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
    reactRoot = createRoot(rootElement);
    reactRoot.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    currentRootElement = rootElement;
    hasAlreadyMounted = true;
    console.log('✅ Bewerbungstrainer: React app mounted successfully');

    // Start observing the element to detect if it gets removed from DOM
    startDOMObserver();
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
