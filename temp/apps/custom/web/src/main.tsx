import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@framework-core/web/platform/platform-styles'
import { CustomShellRoot } from './app/shell/custom-shell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomShellRoot />
  </StrictMode>,
)
