import type { ReactNode } from "react"

import AppLayout from "./AppLayout"

type BillingLayoutProps = {
  children: ReactNode
}

function BillingLayout({ children }: BillingLayoutProps) {
  return <AppLayout>{children}</AppLayout>
}

export default BillingLayout
