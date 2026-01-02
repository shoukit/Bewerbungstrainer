import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ============================================================================
// DEBUG LOGGING - Track app initialization
// ============================================================================
const DEBUG_PREFIX = '[MAIN.JSX]';
console.log(`${DEBUG_PREFIX} 🚀 Script loaded at ${new Date().toISOString()}`);

// ============================================================================
// CSS LOADING CHECK - Wait for stylesheets to load before mounting
// ============================================================================
function waitForCSS() {
  return new Promise((resolve) => {
    // Get all stylesheets from the document
    const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');

    // Look for our app CSS - could be named FeatureInfoButton.css, bewerbungstrainer-app, etc.
    const appCSS = Array.from(styleSheets).filter(link => {
      if (!link.href) return false;
      const href = link.href.toLowerCase();
      return href.includes('bewerbungstrainer') ||
             href.includes('featureinfobutton') ||
             href.includes('karriereheld') ||
             (link.id && link.id.includes('bewerbungstrainer'));
    });

    console.log(`${DEBUG_PREFIX} 🎨 Found ${appCSS.length} app stylesheets`);

    if (appCSS.length === 0) {
      // No external CSS found - wait a bit for inline styles to apply
      console.log(`${DEBUG_PREFIX} 🎨 No external CSS found, waiting for styles to apply...`);
      // Use requestAnimationFrame to ensure styles are computed
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log(`${DEBUG_PREFIX} 🎨 Styles should be applied now`);
          resolve();
        });
      });
      return;
    }

    let loadedCount = 0;
    const totalCount = appCSS.length;

    const checkAllLoaded = () => {
      loadedCount++;
      console.log(`${DEBUG_PREFIX} 🎨 CSS loaded: ${loadedCount}/${totalCount}`);
      if (loadedCount >= totalCount) {
        console.log(`${DEBUG_PREFIX} ✅ All CSS loaded!`);
        // Extra frame to ensure styles are applied
        requestAnimationFrame(() => {
          resolve();
        });
      }
    };

    appCSS.forEach((link) => {
      // Check if already loaded (has stylesheet)
      if (link.sheet) {
        console.log(`${DEBUG_PREFIX} 🎨 CSS already loaded: ${link.href}`);
        checkAllLoaded();
      } else {
        // Wait for load event
        link.addEventListener('load', () => {
          console.log(`${DEBUG_PREFIX} 🎨 CSS load event: ${link.href}`);
          checkAllLoaded();
        });
        link.addEventListener('error', () => {
          console.warn(`${DEBUG_PREFIX} ⚠️ CSS failed to load: ${link.href}`);
          checkAllLoaded(); // Still continue even if one fails
        });
      }
    });

    // Fallback timeout - don't wait forever (3 seconds max)
    setTimeout(() => {
      if (loadedCount < totalCount) {
        console.warn(`${DEBUG_PREFIX} ⚠️ CSS loading timeout, proceeding anyway`);
        resolve();
      }
    }, 3000);
  });
}

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
  // This handles BOTH same-script remounts AND multiple-script-loads (caching issues)
  if (rootElement._reactRootContainer || rootElement.__reactRoot || reactRoot) {
    console.warn(`${DEBUG_PREFIX} ⚠️ Root element already has a React root, skipping re-mount...`);
    hasAlreadyMounted = true;
    return;
  }

  // DOM-based check for multiple script loads (caching issue workaround)
  // This marker survives across different script loads
  if (rootElement.dataset.reactMounted === 'true') {
    console.warn(`${DEBUG_PREFIX} ⚠️ DOM marker indicates React already mounted (likely caching issue), skipping...`);
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

    // Set DOM marker to prevent duplicate mounts from cached scripts
    rootElement.dataset.reactMounted = 'true';

    console.log(`${DEBUG_PREFIX} ✅ React app mounted successfully!`);
  } catch (error) {
    console.error(`${DEBUG_PREFIX} ❌ Failed to mount React app:`, error);
  }
}

// Check if CSS is fully applied by testing a known CSS variable or property
function waitForCSSApplied() {
  return new Promise((resolve) => {
    const maxAttempts = 50; // 500ms max
    let attempts = 0;

    const checkCSS = () => {
      attempts++;

      // Check if our CSS variables are available (from Tailwind/our styles)
      const testEl = document.createElement('div');
      testEl.className = 'bg-primary'; // A class from our styles
      testEl.style.display = 'none';
      document.body.appendChild(testEl);

      const computedStyle = window.getComputedStyle(testEl);
      const hasTailwind = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                          computedStyle.backgroundColor !== 'transparent';

      document.body.removeChild(testEl);

      if (hasTailwind || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          console.log(`${DEBUG_PREFIX} 🎨 CSS check timeout after ${attempts} attempts, proceeding...`);
        } else {
          console.log(`${DEBUG_PREFIX} 🎨 CSS is applied (attempt ${attempts})`);
        }
        resolve();
      } else {
        requestAnimationFrame(checkCSS);
      }
    };

    checkCSS();
  });
}

// WordPress compatibility: Use multiple strategies to ensure DOM is ready
async function waitForDOMAndMount() {
  console.log(`${DEBUG_PREFIX} 🕐 waitForDOMAndMount() called, readyState=${document.readyState}`);

  // Use requestAnimationFrame to ensure we're not blocking the main thread
  // and give other scripts time to initialize
  const safeMount = async (strategy) => {
    console.log(`${DEBUG_PREFIX} 🎬 safeMount() via ${strategy}`);

    // Wait for CSS to load before mounting React
    console.log(`${DEBUG_PREFIX} ⏳ Waiting for CSS to load...`);
    await waitForCSS();

    // Additional check: wait for CSS to be actually applied
    console.log(`${DEBUG_PREFIX} ⏳ Verifying CSS is applied...`);
    await waitForCSSApplied();

    console.log(`${DEBUG_PREFIX} 🎨 CSS ready, mounting React...`);

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
