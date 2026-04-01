import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@framework-core/web/platform/platform-styles'
import { BillingShellRoot } from './shell/billing-shell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BillingShellRoot />
  </StrictMode>,
)
