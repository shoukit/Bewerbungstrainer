import React from 'react';
import ReactDOM from 'react-dom/client';
import VideoTrainingApp from './components/VideoTrainingApp';
import './index.css';

console.log('📹 Video Training App initializing...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('bewerbungstrainer-video-training-app');

  if (container) {
    console.log('📹 Mounting Video Training App to DOM');
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <VideoTrainingApp />
      </React.StrictMode>
    );
  } else {
    console.warn('📹 Video Training container not found - waiting for shortcode');
  }
});
