import { Badge } from '@admin-web/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@admin-web/components/ui/card'

const voucherGroups = [
  {
    name: 'Sales Flow',
    members: ['Sales Invoices', 'Receipts', 'Credit Notes'],
    summary: 'Outgoing sales-side documents and settlement flows.',
  },
  {
    name: 'Purchase Flow',
    members: ['Purchases', 'Payments', 'Debit Notes'],
    summary: 'Supplier-side inward documents and settlement flows.',
  },
  {
    name: 'Adjustment Flow',
    members: ['Journals', 'Contra'],
    summary: 'Non-inventory accounting adjustments and bank or cash transfers.',
  },
]

export function BillingVoucherGroupPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Voucher groups</CardTitle>
          <CardDescription>This scaffold prepares a Tally-style voucher grouping surface. The next batch can bind numbering, permissions, and posting rules at the group level.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {voucherGroups.map((group) => (
            <div key={group.name} className="rounded-[1rem] border border-border/70 bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">{group.name}</p>
                <Badge variant="outline">{group.members.length} items</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{group.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.members.map((member) => (
                  <Badge key={member} variant="secondary">{member}</Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
