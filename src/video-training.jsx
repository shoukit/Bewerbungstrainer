import React from 'react';
import ReactDOM from 'react-dom/client';
import VideoTrainingApp from './components/VideoTrainingApp';
import './index.css';


// Initialize bewerbungstrainerConfig from video training config if available
if (window.bewerbungstrainerVideoTraining && !window.bewerbungstrainerConfig) {
  window.bewerbungstrainerConfig = window.bewerbungstrainerVideoTraining;
} else if (window.bewerbungstrainerConfig) {
} else {
  console.error('📹 No configuration found! Neither bewerbungstrainerVideoTraining nor bewerbungstrainerConfig is defined.');
}

// Function to mount the app
const mountApp = () => {
  const container = document.getElementById('bewerbungstrainer-video-training-app');

  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <VideoTrainingApp />
      </React.StrictMode>
    );
  } else {
    console.warn('📹 Video Training container not found - waiting for shortcode');
  }
};

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  // DOM is already ready, mount immediately
  mountApp();
}
