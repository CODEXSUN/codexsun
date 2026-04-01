import type { CommonModuleItem, Company } from '@shared/index'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EditIcon, Trash2 } from 'lucide-react'
import {
  DetailList,
  DetailSection,
  EntityDetailHeader,
  formatDetailValue,
} from '@/components/entity/entity-detail'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { deactivateCompany, getCompany, HttpError, listCommonModuleItems, restoreCompany } from '@/shared/api/client'
import { toLookupOption } from '@/shared/forms/common-lookup'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'

type ReferenceLabels = Record<string, string>

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load company.'
}

function toReferenceLabels(items: CommonModuleItem[]): ReferenceLabels {
  return items.reduce<ReferenceLabels>((labels, item) => {
    labels[String(item.id)] = toLookupOption(item).label
    return labels
  }, {})
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border/60 last:border-b-0">
      <th className="w-[168px] border-r border-border/70 px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:w-[188px]">
        {label}
      </th>
      <td className="px-4 py-3 text-sm text-foreground">{value}</td>
    </tr>
  )
}

function formatAddress(address: Company['addresses'][number], referenceLabels: ReferenceLabels) {
  return [
    address.addressLine1,
    address.addressLine2,
    address.cityId ? referenceLabels[address.cityId] ?? address.cityId : null,
    address.stateId ? referenceLabels[address.stateId] ?? address.stateId : null,
    address.countryId ? referenceLabels[address.countryId] ?? address.countryId : null,
    address.pincodeId ? referenceLabels[address.pincodeId] ?? address.pincodeId : null,
  ]
    .filter(Boolean)
    .join(', ')
}

export function CompanyShowPage() {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const [item, setItem] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [referenceLabels, setReferenceLabels] = useState<ReferenceLabels>({})

  useEffect(() => {
    let cancelled = false

    async function loadCompany() {
      if (!companyId) return
      setLoading(true)
      setErrorMessage(null)

      try {
        const [company, countries, states, cities, pincodes] = await Promise.all([
          getCompany(companyId),
          listCommonModuleItems('countries', false),
          listCommonModuleItems('states', false),
          listCommonModuleItems('cities', false),
          listCommonModuleItems('pincodes', false),
        ])

        if (!cancelled) {
          setItem(company)
          setReferenceLabels({
            ...toReferenceLabels(countries),
            ...toReferenceLabels(states),
            ...toReferenceLabels(cities),
            ...toReferenceLabels(pincodes),
          })
        }
      } catch (error) {
        if (!cancelled) setErrorMessage(toErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCompany()
    return () => {
      cancelled = true
    }
  }, [companyId])

  async function handleDelete() {
    if (!item) return
    if (!window.confirm(`Delete ${item.name}? This uses the current soft-delete flow.`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateCompany(item.id)
      showStatusChangeToast({
        entityLabel: 'company',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
      void navigate('/admin/dashboard/companies')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'company',
        action: 'deactivate',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDeactivate() {
    if (!item) return
    if (!window.confirm(`Deactivate ${item.name}?`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      const inactive = await deactivateCompany(item.id)
      setItem(inactive)
      showStatusChangeToast({
        entityLabel: 'company',
        recordName: inactive.name,
        referenceId: inactive.id,
        action: 'deactivate',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'company',
        action: 'deactivate',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleRestore() {
    if (!item) return
    setProcessing(true)
    setErrorMessage(null)

    try {
      const restored = await restoreCompany(item.id)
      setItem(restored)
      showStatusChangeToast({
        entityLabel: 'company',
        recordName: restored.name,
        referenceId: restored.id,
        action: 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'company',
        action: 'restore',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading company...</CardContent>
      </Card>
    )
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Company not found.'}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/companies"
        backLabel="Back to companies"
        title={item.name}
        description="Review legal identity, communication channels, locations, and banking records."
        isActive={item.isActive}
        actions={(
          <>
            <Button variant="outline" asChild>
              <Link to={`/admin/dashboard/companies/${item.id}/edit`}>
                <EditIcon className="size-4" />
                Edit
              </Link>
            </Button>
            {item.isActive ? (
              <>
                <Button variant="outline" onClick={() => void handleDeactivate()} disabled={processing}>
                  Deactivate
                </Button>
                <Button variant="destructive" onClick={() => void handleDelete()} disabled={processing}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => void handleRestore()} disabled={processing}>
                Restore
              </Button>
            )}
          </>
        )}
      />

      {errorMessage ? <Card><CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent></Card> : null}

      <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/60">
        <table className="w-full border-collapse">
          <tbody>
            <OverviewRow label="Legal Name" value={formatDetailValue(item.legalName)} />
            <OverviewRow label="Tagline" value={formatDetailValue(item.tagline)} />
            <OverviewRow label="Registration Number" value={formatDetailValue(item.registrationNumber)} />
            <OverviewRow label="PAN" value={formatDetailValue(item.pan)} />
            <OverviewRow label="Financial Year Start" value={formatDetailValue(item.financialYearStart)} />
            <OverviewRow label="Books Start" value={formatDetailValue(item.booksStart)} />
            <OverviewRow label="Website" value={formatDetailValue(item.website)} />
            <OverviewRow label="Description" value={formatDetailValue(item.description)} />
            <OverviewRow label="Facebook" value={formatDetailValue(item.facebookUrl)} />
            <OverviewRow label="Twitter / X" value={formatDetailValue(item.twitterUrl)} />
            <OverviewRow label="Instagram" value={formatDetailValue(item.instagramUrl)} />
            <OverviewRow label="YouTube" value={formatDetailValue(item.youtubeUrl)} />
            <OverviewRow label="Created" value={new Date(item.createdAt).toLocaleString()} />
            <OverviewRow label="Updated" value={new Date(item.updatedAt).toLocaleString()} />
          </tbody>
        </table>
      </div>

      <DetailSection title="Communication" description="Email and phone channels assigned to this company.">
        <DetailList
          items={[...item.emails, ...item.phones]}
          emptyMessage="No communication records captured."
          renderItem={(entry, index) => (
            <div key={`comm-${index}`} className="rounded-[1.25rem] border border-border/70 p-4">
              {'email' in entry ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{entry.email}</p>
                    <p className="text-sm text-muted-foreground">{entry.emailType}</p>
                  </div>
                  <Badge variant="outline">Email</Badge>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{entry.phoneNumber}</p>
                    <p className="text-sm text-muted-foreground">{entry.phoneType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.isPrimary ? <Badge>Primary</Badge> : null}
                    <Badge variant="outline">Phone</Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        />
      </DetailSection>

      <DetailSection title="Addresses" description="Registered, billing, and operational addresses.">
        <DetailList
          items={item.addresses}
          emptyMessage="No address records captured."
          renderItem={(address) => (
            <div key={address.id} className="rounded-[1.25rem] border border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="font-medium text-foreground">{formatAddress(address, referenceLabels) || '-'}</p>
                  <p className="text-sm text-muted-foreground">{address.addressType}</p>
                </div>
                {address.isDefault ? <Badge>Default</Badge> : null}
              </div>
            </div>
          )}
        />
      </DetailSection>

      <DetailSection title="Bank Accounts" description="Settlement and accounting bank records.">
        <DetailList
          items={item.bankAccounts}
          emptyMessage="No bank accounts captured."
          renderItem={(account) => (
            <div key={account.id} className="rounded-[1.25rem] border border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{account.bankName}</p>
                  <p className="text-sm text-muted-foreground">{account.accountNumber} · {account.ifsc}</p>
                  <p className="text-sm text-muted-foreground">{account.accountHolderName}</p>
                </div>
                {account.isPrimary ? <Badge>Primary</Badge> : null}
              </div>
            </div>
          )}
        />
      </DetailSection>
    </div>
  )
}

