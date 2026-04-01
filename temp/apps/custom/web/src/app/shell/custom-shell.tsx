import { BrowserRouter } from 'react-router-dom'
import { App } from '../app'

export function CustomShellRoot() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}
