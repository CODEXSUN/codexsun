import { createCustomApiServer } from './app/custom-api'
import { customApiEnvironment } from './config/environment'

const server = createCustomApiServer()

server.listen(customApiEnvironment.port, () => {
  console.log(`custom-api listening on http://localhost:${customApiEnvironment.port}`)
})
