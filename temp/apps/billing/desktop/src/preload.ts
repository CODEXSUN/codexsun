import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('codexsunBillingDesktop', {
  product: 'billing',
  platform: 'desktop',
  runtime: 'electron',
  status: 'auth-shell',
  navigateToWorkspace(path?: string) {
    return ipcRenderer.invoke('codexsun-billing:navigate', path ?? '/dashboard')
  },
})
