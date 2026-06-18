import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/chakra-petch/vietnamese-300.css'
import '@fontsource/chakra-petch/vietnamese-400.css'
import '@fontsource/chakra-petch/vietnamese-500.css'
import '@fontsource/chakra-petch/vietnamese-600.css'
import '@fontsource/chakra-petch/vietnamese-700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
