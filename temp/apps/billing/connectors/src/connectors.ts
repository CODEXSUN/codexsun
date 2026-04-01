export type ExternalConnectorSystem = 'tally' | 'erpnext'

export interface ExternalConnectorManifest {
  system: ExternalConnectorSystem
  direction: 'bidirectional'
  status: 'scaffold'
  syncEntities: string[]
}

export const externalConnectorManifests: ExternalConnectorManifest[] = [
  {
    system: 'tally',
    direction: 'bidirectional',
    status: 'scaffold',
    syncEntities: ['ledger', 'party', 'item', 'voucher', 'stock-item'],
  },
  {
    system: 'erpnext',
    direction: 'bidirectional',
    status: 'scaffold',
    syncEntities: ['customer', 'supplier', 'item', 'invoice', 'payment', 'stock-entry'],
  },
]
