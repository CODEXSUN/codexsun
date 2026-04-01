export interface DeliveryChannel {
  id: 'web' | 'desktop' | 'api'
  name: string
  summary: string
}

export const deliveryChannels: DeliveryChannel[] = [
  {
    id: 'web',
    name: 'Web',
    summary: 'Browser-based operations console for ERP, CRM, store, and reporting.',
  },
  {
    id: 'desktop',
    name: 'Desktop',
    summary: 'Electron wrapper reusing the same frontend experience for desktop operators.',
  },
  {
    id: 'api',
    name: 'API',
    summary: 'Node.js backend hosting validation, orchestration, posting, and reporting services.',
  },
]
