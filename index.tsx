
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// FORCE UNREGISTER SERVICE WORKER (Zombie PWA Killer)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        console.log('Unregistering SW:', registration);
        registration.unregister();
      }
    });
    caches.keys().then(names => {
      for (const name of names) {
        console.log('Deleting Cache:', name);
        caches.delete(name);
      }
    });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
