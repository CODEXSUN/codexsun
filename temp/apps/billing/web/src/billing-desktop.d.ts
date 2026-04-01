export {}

declare global {
  interface Window {
    codexsunBillingDesktop?: {
      product: 'billing'
      platform: 'desktop'
      runtime: 'electron'
      status: string
      navigateToWorkspace: (path?: string) => Promise<{
        status: 'opened'
        target: string
      }>
    }
  }
}
