import type { CommonModuleItem, Contact } from '@shared/index'
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
import { deactivateContact, getContact, HttpError, listCommonModuleItems, restoreContact } from '@/shared/api/client'
import { toLookupOption } from '@/shared/forms/common-lookup'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'

type ReferenceLabels = Record<string, string>

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load contact.'
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

function formatAddress(address: Contact['addresses'][number], referenceLabels: ReferenceLabels) {
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

export function ContactShowPage() {
  const navigate = useNavigate()
  const { contactId } = useParams()
  const [item, setItem] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [referenceLabels, setReferenceLabels] = useState<ReferenceLabels>({})

  useEffect(() => {
    let cancelled = false

    async function loadContact() {
      if (!contactId) return
      setLoading(true)
      setErrorMessage(null)

      try {
        const [contact, contactTypes, countries, states, cities, pincodes] = await Promise.all([
          getContact(contactId),
          listCommonModuleItems('contactTypes', false),
          listCommonModuleItems('countries', false),
          listCommonModuleItems('states', false),
          listCommonModuleItems('cities', false),
          listCommonModuleItems('pincodes', false),
        ])

        if (!cancelled) {
          setItem(contact)
          setReferenceLabels({
            ...toReferenceLabels(contactTypes),
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

    void loadContact()
    return () => {
      cancelled = true
    }
  }, [contactId])

  function resolveReferenceLabel(value: string | null | undefined): string {
    if (!value) return formatDetailValue(value)
    return referenceLabels[value] ?? formatDetailValue(value)
  }

  async function handleDelete() {
    if (!item) return
    if (!window.confirm(`Delete ${item.name}? This uses the current soft-delete flow.`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateContact(item.id)
      showStatusChangeToast({
        entityLabel: 'contact',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
      void navigate('/admin/dashboard/contacts')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'contact',
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
      const inactive = await deactivateContact(item.id)
      setItem(inactive)
      showStatusChangeToast({
        entityLabel: 'contact',
        recordName: inactive.name,
        referenceId: inactive.id,
        action: 'deactivate',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'contact',
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
      const restored = await restoreContact(item.id)
      setItem(restored)
      showStatusChangeToast({
        entityLabel: 'contact',
        recordName: restored.name,
        referenceId: restored.id,
        action: 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'contact',
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
        <CardContent className="p-8 text-sm text-muted-foreground">Loading contact...</CardContent>
      </Card>
    )
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Contact not found.'}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/contacts"
        backLabel="Back to contacts"
        title={item.name}
        description="Review profile, tax identity, communication channels, and financial records."
        isActive={item.isActive}
        actions={(
          <>
            <Button variant="outline" asChild>
              <Link to={`/admin/dashboard/contacts/${item.id}/edit`}>
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
            <OverviewRow label="Contact Type" value={resolveReferenceLabel(item.contactTypeId)} />
            <OverviewRow label="Legal Name" value={formatDetailValue(item.legalName)} />
            <OverviewRow label="PAN" value={formatDetailValue(item.pan)} />
            <OverviewRow label="GSTIN" value={formatDetailValue(item.gstin)} />
            <OverviewRow label="MSME Type" value={formatDetailValue(item.msmeType)} />
            <OverviewRow label="MSME Number" value={formatDetailValue(item.msmeNo)} />
            <OverviewRow label="Opening Balance" value={item.openingBalance.toFixed(2)} />
            <OverviewRow label="Balance Type" value={formatDetailValue(item.balanceType)} />
            <OverviewRow label="Credit Limit" value={item.creditLimit.toFixed(2)} />
            <OverviewRow label="Website" value={formatDetailValue(item.website)} />
            <OverviewRow label="Description" value={formatDetailValue(item.description)} />
            <OverviewRow label="Updated" value={new Date(item.updatedAt).toLocaleString()} />
          </tbody>
        </table>
      </div>

      <DetailSection title="Communication" description="Primary and secondary communication records.">
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
                  {entry.isPrimary ? <Badge>Primary</Badge> : <Badge variant="outline">Email</Badge>}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{entry.phoneNumber}</p>
                    <p className="text-sm text-muted-foreground">{entry.phoneType}</p>
                  </div>
                  {entry.isPrimary ? <Badge>Primary</Badge> : <Badge variant="outline">Phone</Badge>}
                </div>
              )}
            </div>
          )}
        />
      </DetailSection>

      <DetailSection title="Addresses" description="Billing, shipping, office, and branch addresses.">
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

      <DetailSection title="Finance" description="Banking and GST registration records.">
        <DetailList
          items={[...item.bankAccounts, ...item.gstDetails]}
          emptyMessage="No finance records captured."
          renderItem={(entry, index) => (
            <div key={`finance-${index}`} className="rounded-[1.25rem] border border-border/70 p-4">
              {'bankName' in entry ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{entry.bankName}</p>
                    <p className="text-sm text-muted-foreground">{entry.accountNumber} · {entry.ifsc}</p>
                    <p className="text-sm text-muted-foreground">{entry.accountHolderName}</p>
                  </div>
                  {entry.isPrimary ? <Badge>Primary</Badge> : null}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{entry.gstin}</p>
                    <p className="text-sm text-muted-foreground">{entry.state}</p>
                  </div>
                  {entry.isDefault ? <Badge>Default</Badge> : null}
                </div>
              )}
            </div>
          )}
        />
      </DetailSection>
    </div>
  )
}

