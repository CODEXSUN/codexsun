import { createServer } from 'node:http'

import { billingCoreManifest } from '../../core/src/index'
import { externalConnectorManifests } from '../../connectors/src/index'

const billingServer = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(
    JSON.stringify({
      product: billingCoreManifest.product,
      domain: billingCoreManifest.domain,
      connectors: externalConnectorManifests,
      status: 'scaffold',
      message: 'codexsun Billing API scaffold is online.',
    }),
  )
})

export function startBillingServer(port = 4310) {
  return new Promise<void>((resolve) => {
    billingServer.listen(port, () => {
      resolve()
    })
  })
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  void startBillingServer()
}
