import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ============================================================================
// DEBUG LOGGING - Track app initialization
// ============================================================================
const DEBUG_PREFIX = '[MAIN.JSX]';
console.log(`${DEBUG_PREFIX} 🚀 Script loaded at ${new Date().toISOString()}`);

// Keep track of whether we've already mounted to prevent double mounting
let hasAlreadyMounted = false;
let reactRoot = null;

// Initialize React app when DOM is ready
function initReactApp() {
  console.log(`${DEBUG_PREFIX} 📦 initReactApp() called, hasAlreadyMounted=${hasAlreadyMounted}`);

  // Prevent double mounting
  if (hasAlreadyMounted) {
    console.log(`${DEBUG_PREFIX} ⏭️ Skipping - already mounted`);
    return;
  }

  // Support both WordPress and standalone mode
  const rootElement = document.getElementById('bewerbungstrainer-app') || document.getElementById('root');
  console.log(`${DEBUG_PREFIX} 🔍 Looking for root element:`, rootElement ? 'FOUND' : 'NOT FOUND');

  if (!rootElement) {
    console.error(`${DEBUG_PREFIX} ❌ Root element not found! Looking for #bewerbungstrainer-app or #root`);
    return;
  }

  // Check if element already has React root - skip re-mounting
  if (rootElement._reactRootContainer || rootElement.__reactRoot || reactRoot) {
    console.warn(`${DEBUG_PREFIX} ⚠️ Root element already has a React root, skipping re-mount...`);
    hasAlreadyMounted = true;
    return;
  }

  try {
    console.log(`${DEBUG_PREFIX} 🧹 Clearing root element children...`);

    // Clear loading content safely
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }

    console.log(`${DEBUG_PREFIX} 🎯 Creating React root with StrictMode...`);
    reactRoot = createRoot(rootElement);
    reactRoot.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    hasAlreadyMounted = true;
    console.log(`${DEBUG_PREFIX} ✅ React app mounted successfully!`);
  } catch (error) {
    console.error(`${DEBUG_PREFIX} ❌ Failed to mount React app:`, error);
  }
}

// WordPress compatibility: Use multiple strategies to ensure DOM is ready
function waitForDOMAndMount() {
  console.log(`${DEBUG_PREFIX} 🕐 waitForDOMAndMount() called, readyState=${document.readyState}`);

  // Use requestAnimationFrame to ensure we're not blocking the main thread
  // and give other scripts time to initialize
  const safeMount = (strategy) => {
    console.log(`${DEBUG_PREFIX} 🎬 safeMount() via ${strategy}`);
    requestAnimationFrame(() => {
      try {
        initReactApp();
      } catch (error) {
        console.error(`${DEBUG_PREFIX} ❌ Error during mount:`, error);
      }
    });
  };

  // Strategy 1: If element is already available, mount after a small delay
  if (document.getElementById('bewerbungstrainer-app') || document.getElementById('root')) {
    console.log(`${DEBUG_PREFIX} 📍 Strategy 1: Element already available`);
    // Small delay to let other scripts initialize first
    setTimeout(() => safeMount('Strategy1-ElementExists'), 50);
    return;
  }

  // Strategy 2: Wait for DOMContentLoaded
  if (document.readyState === 'loading') {
    console.log(`${DEBUG_PREFIX} 📍 Strategy 2: Waiting for DOMContentLoaded`);
    document.addEventListener('DOMContentLoaded', () => {
      console.log(`${DEBUG_PREFIX} 📢 DOMContentLoaded fired`);
      setTimeout(() => safeMount('Strategy2-DOMContentLoaded'), 50);
    });
  } else {
    // Strategy 3: DOM is already loaded, but element might not be rendered yet
    console.log(`${DEBUG_PREFIX} 📍 Strategy 3: Polling for element`);

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const checkInterval = setInterval(() => {
      attempts++;

      if (document.getElementById('bewerbungstrainer-app') || document.getElementById('root')) {
        console.log(`${DEBUG_PREFIX} ✅ Element found after ${attempts} attempts`);
        clearInterval(checkInterval);
        setTimeout(() => safeMount('Strategy3-Polling'), 50);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error(`${DEBUG_PREFIX} ❌ Element not found after 5 seconds`);
      }
    }, 100);
  }
}

// Start the mounting process
console.log(`${DEBUG_PREFIX} 🏁 Starting mount process...`);
waitForDOMAndMount();
