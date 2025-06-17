import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.optimized';
import reportWebVitals from './reportWebVitals';
// import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker temporarily disabled to fix caching issues

reportWebVitals();
