import type { ReactNode } from "react"

import WebLayout from "./WebLayout"

type StoreLayoutProps = {
  children: ReactNode
}

function StoreLayout({ children }: StoreLayoutProps) {
  return <WebLayout>{children}</WebLayout>
}

export default StoreLayout
