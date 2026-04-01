import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('codexsunDesktop', {
  platform: 'desktop',
  runtime: 'electron',
})
