import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PlatformRoot } from './web/platform/platform-root'
import './web/platform/platform-styles'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlatformRoot />
  </StrictMode>,
)
