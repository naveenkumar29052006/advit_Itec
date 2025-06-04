import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'

/**
 * Application entry point
 * 
 * Renders the main App component inside React's StrictMode for development safety.
 * The root element is defined in index.html as <div id="root"></div>
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
