import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  Check,
  CircleAlert,
  CreditCard,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import type { CommonModuleItem, ContactAddressInput } from "@core/shared"
import type { CustomerProfileLookupResponse } from "@ecommerce/shared"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { CommercePrice } from "@/components/ux/commerce-price"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
import { cn } from "@/lib/utils"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import {
  handleStorefrontImageError,
  resolveStorefrontImageUrl,
} from "../lib/storefront-image"
import { storefrontPaths } from "../lib/storefront-routes"

type CheckoutAddressState = {
  fullName: string
  email: string
  phoneNumber: string
  line1: string
  line2: string
  city: string
  state: string
  country: string
  pincode: string
}

type CheckoutLookupState = {
  addressTypes: CommonModuleItem[]
  countries: CommonModuleItem[]
  states: CommonModuleItem[]
  districts: CommonModuleItem[]
  cities: CommonModuleItem[]
  pincodes: CommonModuleItem[]
}

type DeliveryAddressOption = CheckoutAddressState & {
  key: string
  label: string
  isDefault: boolean
  isComplete: boolean
}

type AddressDialogState = {
  label: string
  firstName: string
  lastName: string
  phoneNumber: string
  line1: string
  line2: string
  countryId: string
  stateId: string
  cityId: string
  pincodeId: string
  country: string
  state: string
  city: string
  pincode: string
  setAsDefault: boolean
}

type DeliveryPreference = {
  id: string
  label: string
  description: string
  shippingAmount: number
  handlingAmount: number
}

type PaymentOption = {
  id: string
  label: string
  description: string
  summaryLabel: string
  enabled: boolean
}

type PendingPaymentCheckout = {
  orderId: string
  orderNumber: string
  providerOrderId: string
  totalAmount: number
  shippingEmail: string
}

const freeShippingThreshold = 5000
const fallbackShippingAmount = 199
const fallbackHandlingAmount = 99
const addressDraftDefaults: Omit<
  AddressDialogState,
  "firstName" | "lastName" | "phoneNumber" | "countryId"
> = {
  label: "Home",
  line1: "",
  line2: "",
  stateId: "1",
  cityId: "1",
  pincodeId: "1",
  country: "India",
  state: "",
  city: "",
  pincode: "",
  setAsDefault: true,
}
const deliveryPreferences: DeliveryPreference[] = [
  {
    id: "standard",
    label: "Standard delivery",
    description: "3-5 business days. Free over INR 5,000.",
    shippingAmount: fallbackShippingAmount,
    handlingAmount: fallbackHandlingAmount,
  },
  {
    id: "priority",
    label: "Priority delivery",
    description: "1-2 business days. INR 299.",
    shippingAmount: 299,
    handlingAmount: fallbackHandlingAmount,
  },
  {
    id: "signature",
    label: "Signature packaging",
    description: "Occasion-ready packaging with premium handoff.",
    shippingAmount: fallbackShippingAmount,
    handlingAmount: 159,
  },
]
const paymentOptions: PaymentOption[] = [
  {
    id: "upi-wallet",
    label: "UPI / Wallet",
    description: "Opens Razorpay Checkout with UPI and wallet payment methods.",
    summaryLabel: "Razorpay Checkout",
    enabled: true,
  },
  {
    id: "card",
    label: "Credit or debit card",
    description: "Opens Razorpay Checkout and completes payment before confirmation.",
    summaryLabel: "Razorpay Card Checkout",
    enabled: true,
  },
  {
    id: "cash-on-delivery",
    label: "Cash on delivery (Coming soon)",
    description: "Shown for preview only while checkout stays on Razorpay today.",
    summaryLabel: "Coming soon",
    enabled: false,
  },
]

function createLookupState(
  response?: CustomerProfileLookupResponse
): CheckoutLookupState {
  return {
    addressTypes: response?.addressTypes ?? [],
    countries: response?.countries ?? [],
    states: response?.states ?? [],
    districts: response?.districts ?? [],
    cities: response?.cities ?? [],
    pincodes: response?.pincodes ?? [],
  }
}

function getCommonModuleValue(item: CommonModuleItem, key: string) {
  const value = item[key]
  return typeof value === "string" || typeof value === "number" ? String(value) : ""
}

function getCommonModuleLabel(item: CommonModuleItem, module: keyof CheckoutLookupState) {
  if (module === "pincodes") {
    return (
      getCommonModuleValue(item, "code") ||
      getCommonModuleValue(item, "area_name") ||
      getCommonModuleValue(item, "name") ||
      item.id
    )
  }

  return (
    getCommonModuleValue(item, "name") ||
    getCommonModuleValue(item, "label") ||
    getCommonModuleValue(item, "code") ||
    item.id
  )
}

function resolveLookupLabel(
  items: CommonModuleItem[],
  value: string | null | undefined,
  module: keyof CheckoutLookupState
) {
  if (!value) {
    return ""
  }

  const match = items.find((item) => item.id === value)
  return match ? getCommonModuleLabel(match, module) : ""
}

function filterLookupItems(
  items: CommonModuleItem[],
  references: Array<{ field: string; value: string }>
) {
  return items.filter((item) =>
    references.every(({ field, value }) => {
      if (!value || value === "1") {
        return true
      }

      const itemValue = getCommonModuleValue(item, field)
      return !itemValue || itemValue === "1" || itemValue === value
    })
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function splitDisplayName(displayName: string | null | undefined) {
  const parts = (displayName ?? "").trim().split(/\s+/).filter(Boolean)
  const [firstName = "", ...rest] = parts

  return {
    firstName,
    lastName: rest.join(" "),
  }
}

function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function buildAddressFingerprint(address: CheckoutAddressState) {
  return [address.line1, address.pincode, address.phoneNumber]
    .map((value) => value.trim().toLowerCase())
    .join("|")
}

function isCompleteDeliveryAddress(address: CheckoutAddressState | null | undefined) {
  if (!address) {
    return false
  }

  return [
    address.fullName,
    address.phoneNumber,
    address.line1,
    address.city,
    address.state,
    address.country,
    address.pincode,
  ].every((value) => value.trim().length > 0)
}

function resolvePreferredCountryId(items: CommonModuleItem[]) {
  const indiaMatch = items.find(
    (item) => getCommonModuleLabel(item, "countries").trim().toLowerCase() === "india"
  )

  return indiaMatch?.id ?? items[0]?.id ?? "1"
}

function resolveAddressTypeId(label: string, addressTypes: CommonModuleItem[]) {
  const normalizedLabel = label.trim().toLowerCase()

  const directMatch = addressTypes.find((item) => {
    const name = getCommonModuleLabel(item, "addressTypes").trim().toLowerCase()
    const code = getCommonModuleValue(item, "code").trim().toLowerCase()

    return normalizedLabel === name || normalizedLabel === code
  })

  if (directMatch) {
    return directMatch.id
  }

  const homeMatch = addressTypes.find((item) => {
    const labelValue = getCommonModuleLabel(item, "addressTypes").trim().toLowerCase()
    return labelValue.includes("home")
  })

  return homeMatch?.id ?? addressTypes[0]?.id ?? "1"
}

function createAddressDialogState(params: {
  displayName?: string | null
  phoneNumber?: string | null
  defaultCountryId: string
}) {
  const { firstName, lastName } = splitDisplayName(params.displayName)

  return {
    ...addressDraftDefaults,
    firstName,
    lastName,
    phoneNumber: params.phoneNumber ?? "",
    countryId: params.defaultCountryId,
  } satisfies AddressDialogState
}

function CheckoutSummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: React.ReactNode
  emphasized?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-sm",
        emphasized && "border-t border-[#e7dacb] pt-4 text-base font-semibold text-foreground"
      )}
    >
      <span className={cn("text-muted-foreground", emphasized && "text-foreground")}>
        {label}
      </span>
      <div className="text-right text-foreground">{value}</div>
    </div>
  )
}

function ChoiceCard({
  value,
  title,
  description,
  active,
  disabled = false,
  onSelect,
}: {
  value: string
  title: string
  description: string
  active: boolean
  disabled?: boolean
  onSelect: (value: string) => void
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-[1.6rem] border px-4 py-4 transition",
        active
          ? "border-[#d0baa4] bg-[#fffdfa] shadow-[0_18px_34px_-28px_rgba(48,31,19,0.16)]"
          : "border-[#e6d9cb] bg-white/90 hover:border-[#d8c7b7] hover:bg-white",
        disabled && "cursor-not-allowed opacity-55 hover:border-[#e6d9cb] hover:bg-white/90"
      )}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault()
          return
        }

        onSelect(value)
      }}
    >
      <RadioGroupItem
        value={value}
        disabled={disabled}
        className="mt-1 size-4 border-[#ccb8a5] bg-white text-white data-checked:border-[#8b5e34] data-checked:bg-[#8b5e34]"
      />
      <div className="min-w-0">
        <div className="text-[17px] font-semibold tracking-tight text-foreground">{title}</div>
        <div className="mt-1 text-sm leading-6 text-muted-foreground">{description}</div>
      </div>
    </label>
  )
}

export function StorefrontCheckoutPage() {
  const navigate = useNavigate()
  const cart = useStorefrontCart()
  const customerAuth = useStorefrontCustomerAuth()
  const [lookupState, setLookupState] = useState<CheckoutLookupState>(() =>
    createLookupState()
  )
  const [isLoadingLookups, setIsLoadingLookups] = useState(false)
  const [contactEmail, setContactEmail] = useState("")
  const [orderNote, setOrderNote] = useState("")
  const [selectedAddressKey, setSelectedAddressKey] = useState<string | null>(null)
  const [temporaryAddresses, setTemporaryAddresses] = useState<DeliveryAddressOption[]>([])
  const [addressLabels, setAddressLabels] = useState<Record<string, string>>({})
  const [pendingAddressFingerprint, setPendingAddressFingerprint] = useState<{
    fingerprint: string
    label: string
  } | null>(null)
  const [selectedDeliveryPreference, setSelectedDeliveryPreference] =
    useState<string>("standard")
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("upi-wallet")
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false)
  const [addressDialogState, setAddressDialogState] = useState<AddressDialogState>(() =>
    createAddressDialogState({
      displayName: null,
      phoneNumber: null,
      defaultCountryId: "1",
    })
  )
  const [addressDialogError, setAddressDialogError] = useState<string | null>(null)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingPaymentCheckout, setPendingPaymentCheckout] =
    useState<PendingPaymentCheckout | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentContactEmail, setPaymentContactEmail] = useState("")
  const [paymentMobileNumber, setPaymentMobileNumber] = useState("")
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

  const defaultCountryId = useMemo(
    () => resolvePreferredCountryId(lookupState.countries),
    [lookupState.countries]
  )

  useEffect(() => {
    if (customerAuth.customer?.email && !contactEmail.trim()) {
      setContactEmail(customerAuth.customer.email)
    }
  }, [contactEmail, customerAuth.customer?.email])

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      if (!customerAuth.accessToken || !customerAuth.isAuthenticated) {
        setLookupState(createLookupState())
        setIsLoadingLookups(false)
        return
      }

      setIsLoadingLookups(true)

      try {
        const response = await storefrontApi.getCustomerProfileLookups(
          customerAuth.accessToken
        )

        if (!cancelled) {
          setLookupState(createLookupState(response))
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load checkout lookups."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLookups(false)
        }
      }
    }

    void loadLookups()

    return () => {
      cancelled = true
    }
  }, [customerAuth.accessToken, customerAuth.isAuthenticated])

  const deliveryAddresses = useMemo(() => {
    const savedAddresses =
      customerAuth.customer?.addresses.map((address, index) => {
        const fallbackLabel =
          resolveLookupLabel(lookupState.addressTypes, address.addressTypeId, "addressTypes") ||
          `Saved address ${index + 1}`

        return {
          key: address.id,
          label: addressLabels[address.id] ?? fallbackLabel,
          fullName: customerAuth.customer?.displayName ?? "",
          email: customerAuth.customer?.email ?? contactEmail,
          phoneNumber: customerAuth.customer?.phoneNumber ?? "",
          line1: address.addressLine1,
          line2: address.addressLine2 ?? "",
          city: resolveLookupLabel(lookupState.cities, address.cityId, "cities"),
          state: resolveLookupLabel(lookupState.states, address.stateId, "states"),
          country: resolveLookupLabel(
            lookupState.countries,
            address.countryId,
            "countries"
          ),
          pincode: resolveLookupLabel(lookupState.pincodes, address.pincodeId, "pincodes"),
          isDefault: address.isDefault,
          isComplete: false,
        } satisfies DeliveryAddressOption
      }) ?? []

    return [...savedAddresses, ...temporaryAddresses].map((address) => ({
      ...address,
      isComplete: isCompleteDeliveryAddress(address),
    }))
  }, [
    addressLabels,
    contactEmail,
    customerAuth.customer,
    lookupState.addressTypes,
    lookupState.cities,
    lookupState.countries,
    lookupState.pincodes,
    lookupState.states,
    temporaryAddresses,
  ])

  useEffect(() => {
    if (selectedAddressKey && deliveryAddresses.some((address) => address.key === selectedAddressKey)) {
      return
    }

    const fallbackAddress =
      deliveryAddresses.find((address) => address.isDefault && address.isComplete) ??
      deliveryAddresses.find((address) => address.isComplete) ??
      deliveryAddresses.find((address) => address.isDefault) ??
      deliveryAddresses[0] ??
      null

    setSelectedAddressKey(fallbackAddress?.key ?? null)
  }, [deliveryAddresses, selectedAddressKey])

  useEffect(() => {
    if (!pendingAddressFingerprint) {
      return
    }

    const nextSelectedAddress = deliveryAddresses.find(
      (address) =>
        buildAddressFingerprint(address) === pendingAddressFingerprint.fingerprint
    )

    if (!nextSelectedAddress) {
      return
    }

    setAddressLabels((current) => ({
      ...current,
      [nextSelectedAddress.key]: pendingAddressFingerprint.label,
    }))
    setSelectedAddressKey(nextSelectedAddress.key)
    setPendingAddressFingerprint(null)
  }, [deliveryAddresses, pendingAddressFingerprint])

  const selectedAddress =
    deliveryAddresses.find((address) => address.key === selectedAddressKey) ?? null
  const selectedAddressIsComplete = isCompleteDeliveryAddress(selectedAddress)

  const selectedDeliveryOption =
    deliveryPreferences.find((option) => option.id === selectedDeliveryPreference) ??
    deliveryPreferences[0]

  const selectedPaymentOption =
    paymentOptions.find((option) => option.id === selectedPaymentMethod) ?? paymentOptions[0]

  const shippingAmount =
    cart.items.length === 0
      ? 0
      : selectedDeliveryOption.id === "standard" &&
          cart.subtotalAmount >= freeShippingThreshold
        ? 0
        : selectedDeliveryOption.shippingAmount

  const handlingAmount = cart.items.length === 0 ? 0 : selectedDeliveryOption.handlingAmount
  const totalAmount = cart.subtotalAmount + shippingAmount + handlingAmount
  const totalSavings = cart.items.reduce(
    (sum, item) => sum + Math.max(0, (item.mrp - item.unitPrice) * item.quantity),
    0
  )
  const filteredStateOptions = useMemo(
    () =>
      filterLookupItems(lookupState.states, [
        { field: "country_id", value: addressDialogState.countryId },
      ]),
    [addressDialogState.countryId, lookupState.states]
  )
  const filteredCityOptions = useMemo(
    () =>
      filterLookupItems(lookupState.cities, [
        { field: "state_id", value: addressDialogState.stateId },
      ]),
    [addressDialogState.stateId, lookupState.cities]
  )
  const filteredPincodeOptions = useMemo(
    () =>
      filterLookupItems(lookupState.pincodes, [
        { field: "state_id", value: addressDialogState.stateId },
        { field: "city_id", value: addressDialogState.cityId },
      ]),
    [addressDialogState.cityId, addressDialogState.stateId, lookupState.pincodes]
  )

  useEffect(() => {
    if (!isAddressDialogOpen || addressDialogState.stateId !== "1" || filteredStateOptions.length === 0) {
      return
    }

    setAddressDialogState((current) => ({
      ...current,
      stateId: filteredStateOptions[0]!.id,
    }))
  }, [
    addressDialogState.stateId,
    filteredStateOptions,
    isAddressDialogOpen,
  ])

  useEffect(() => {
    if (!isAddressDialogOpen || addressDialogState.cityId !== "1" || filteredCityOptions.length === 0) {
      return
    }

    setAddressDialogState((current) => ({
      ...current,
      cityId: filteredCityOptions[0]!.id,
    }))
  }, [
    addressDialogState.cityId,
    filteredCityOptions,
    isAddressDialogOpen,
  ])

  useEffect(() => {
    if (
      !isAddressDialogOpen ||
      addressDialogState.pincodeId !== "1" ||
      filteredPincodeOptions.length === 0
    ) {
      return
    }

    setAddressDialogState((current) => ({
      ...current,
      pincodeId: filteredPincodeOptions[0]!.id,
    }))
  }, [
    addressDialogState.pincodeId,
    filteredPincodeOptions,
    isAddressDialogOpen,
  ])

  function openAddressDialog() {
    setAddressDialogError(null)
    setAddressDialogState(
      createAddressDialogState({
        displayName: customerAuth.customer?.displayName,
        phoneNumber: customerAuth.customer?.phoneNumber,
        defaultCountryId,
      })
    )
    setIsAddressDialogOpen(true)
  }

  function updateAddressDialogState(
    recipe: (current: AddressDialogState) => AddressDialogState
  ) {
    setAddressDialogState((current) => recipe(current))
  }

  async function routeAfterPayment(orderId: string, shippingEmail: string, orderNumber: string) {
    cart.clear()

    if (customerAuth.isAuthenticated) {
      await customerAuth.refresh()
      void navigate(storefrontPaths.accountOrder(orderId))
      return
    }

    void navigate(
      storefrontPaths.trackOrder({
        orderNumber,
        email: shippingEmail,
      })
    )
  }

  async function handleSaveAddress() {
    const fullName = buildFullName(
      addressDialogState.firstName,
      addressDialogState.lastName
    )
    const countryLabel =
      resolveLookupLabel(lookupState.countries, addressDialogState.countryId, "countries") ||
      addressDialogState.country.trim()
    const stateLabel =
      resolveLookupLabel(lookupState.states, addressDialogState.stateId, "states") ||
      addressDialogState.state.trim()
    const cityLabel =
      resolveLookupLabel(lookupState.cities, addressDialogState.cityId, "cities") ||
      addressDialogState.city.trim()
    const pincodeLabel =
      resolveLookupLabel(lookupState.pincodes, addressDialogState.pincodeId, "pincodes") ||
      addressDialogState.pincode.trim()

    if (!addressDialogState.label.trim()) {
      setAddressDialogError("Address label is required.")
      return
    }

    if (!fullName) {
      setAddressDialogError("First name is required.")
      return
    }

    if (!addressDialogState.phoneNumber.trim()) {
      setAddressDialogError("Phone is required.")
      return
    }

    if (!addressDialogState.line1.trim()) {
      setAddressDialogError("Address line 1 is required.")
      return
    }

    if (!countryLabel || !stateLabel || !cityLabel || !pincodeLabel) {
      setAddressDialogError("Country, state, city, and postal code are required.")
      return
    }

    const nextAddress: DeliveryAddressOption = {
      key: `temp-${Date.now()}`,
      label: addressDialogState.label.trim(),
      fullName,
      email: contactEmail.trim(),
      phoneNumber: addressDialogState.phoneNumber.trim(),
      line1: addressDialogState.line1.trim(),
      line2: addressDialogState.line2.trim(),
      city: cityLabel,
      state: stateLabel,
      country: countryLabel,
      pincode: pincodeLabel,
      isDefault: addressDialogState.setAsDefault,
      isComplete: true,
    }

    setAddressDialogError(null)
    setIsSavingAddress(true)

    try {
      if (customerAuth.isAuthenticated && customerAuth.customer) {
        const existingAddresses = customerAuth.customer.addresses.map((address) => ({
          addressTypeId: address.addressTypeId ?? "1",
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? "-",
          cityId: address.cityId ?? "1",
          districtId: address.districtId ?? "1",
          stateId: address.stateId ?? "1",
          countryId: address.countryId ?? "1",
          pincodeId: address.pincodeId ?? "1",
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: addressDialogState.setAsDefault ? false : address.isDefault,
        }))
        const pincodeRecord = lookupState.pincodes.find(
          (item) => item.id === addressDialogState.pincodeId
        )
        const cityRecord = lookupState.cities.find(
          (item) => item.id === addressDialogState.cityId
        )

        const nextProfileAddresses = [
          ...existingAddresses,
          {
            addressTypeId: resolveAddressTypeId(
              addressDialogState.label,
              lookupState.addressTypes
            ),
            addressLine1: nextAddress.line1,
            addressLine2: nextAddress.line2 || "-",
            cityId: addressDialogState.cityId || "1",
            districtId:
              getCommonModuleValue(pincodeRecord ?? cityRecord ?? ({} as CommonModuleItem), "district_id") ||
              "1",
            stateId: addressDialogState.stateId || "1",
            countryId: addressDialogState.countryId || "1",
            pincodeId: addressDialogState.pincodeId || "1",
            latitude: null,
            longitude: null,
            isDefault: addressDialogState.setAsDefault,
          } satisfies ContactAddressInput,
        ]

        await customerAuth.updateProfile({
          displayName: fullName,
          phoneNumber: nextAddress.phoneNumber,
          companyName: customerAuth.customer.companyName ?? null,
          legalName: customerAuth.customer.legalName ?? null,
          gstin: customerAuth.customer.gstin ?? null,
          website: customerAuth.customer.website ?? null,
          addresses: nextProfileAddresses,
          emails: customerAuth.customer.emails.map((entry) => ({
            email: entry.email,
            emailType: entry.emailType,
            isPrimary: entry.isPrimary,
          })),
          phones:
            customerAuth.customer.phones.length > 0
              ? customerAuth.customer.phones.map((entry, index) => ({
                  phoneNumber:
                    entry.isPrimary || index === 0
                      ? nextAddress.phoneNumber
                      : entry.phoneNumber,
                  phoneType: entry.phoneType,
                  isPrimary: entry.isPrimary,
                }))
              : [
                  {
                    phoneNumber: nextAddress.phoneNumber,
                    phoneType: "mobile",
                    isPrimary: true,
                  },
                ],
          bankAccounts: customerAuth.customer.bankAccounts.map((entry) => ({
            bankName: entry.bankName,
            accountNumber: entry.accountNumber,
            accountHolderName: entry.accountHolderName,
            ifsc: entry.ifsc,
            branch: entry.branch ?? "-",
            isPrimary: entry.isPrimary,
          })),
          gstDetails: customerAuth.customer.gstDetails.map((entry) => ({
            gstin: entry.gstin,
            state: entry.state,
            isDefault: entry.isDefault,
          })),
        })

        setTemporaryAddresses((current) => [
          ...current.map((address) => ({
            ...address,
            isDefault: addressDialogState.setAsDefault ? false : address.isDefault,
          })),
          nextAddress,
        ])
        setSelectedAddressKey(nextAddress.key)

        setPendingAddressFingerprint({
          fingerprint: buildAddressFingerprint(nextAddress),
          label: nextAddress.label,
        })
      } else {
        setTemporaryAddresses((current) => [
          ...current.map((address) => ({
            ...address,
            isDefault: addressDialogState.setAsDefault ? false : address.isDefault,
          })),
          nextAddress,
        ])
        setSelectedAddressKey(nextAddress.key)
      }

      setIsAddressDialogOpen(false)
    } catch (saveError) {
      setAddressDialogError(
        saveError instanceof Error ? saveError.message : "Failed to save the address."
      )
    } finally {
      setIsSavingAddress(false)
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      setError("Select or add a delivery address before continuing.")
      openAddressDialog()
      return
    }

    if (!isCompleteDeliveryAddress(selectedAddress)) {
      setError("Select a complete delivery address or add a new one before continuing.")
      openAddressDialog()
      return
    }

    if (!isValidEmail(contactEmail)) {
      setError("Enter a valid contact email before continuing.")
      return
    }

    const shippingAddress: CheckoutAddressState = {
      ...selectedAddress,
      email: contactEmail.trim(),
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const checkout = await storefrontApi.createCheckout(customerAuth.accessToken, {
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          ...shippingAddress,
          line2: shippingAddress.line2 || null,
        },
        billingAddress: {
          ...shippingAddress,
          line2: shippingAddress.line2 || null,
        },
        notes: orderNote.trim() || null,
      })

      setPendingPaymentCheckout({
        orderId: checkout.order.id,
        orderNumber: checkout.order.orderNumber,
        providerOrderId: checkout.payment.providerOrderId ?? "",
        totalAmount: checkout.order.totalAmount,
        shippingEmail: checkout.order.shippingAddress.email,
      })
      setPaymentContactEmail(shippingAddress.email)
      setPaymentMobileNumber(shippingAddress.phoneNumber)
      setPaymentSuccessMessage(null)
      setIsPaymentDialogOpen(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to place the order."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCompleteDummyPayment() {
    if (!pendingPaymentCheckout) {
      return
    }

    if (!isValidEmail(paymentContactEmail)) {
      setError("Enter a valid payment email before continuing.")
      return
    }

    if (!paymentMobileNumber.trim()) {
      setError("Enter a mobile number before confirming payment.")
      return
    }

    setError(null)
    setIsConfirmingPayment(true)

    try {
      const verified = await storefrontApi.verifyCheckoutPayment({
        orderId: pendingPaymentCheckout.orderId,
        providerOrderId: pendingPaymentCheckout.providerOrderId,
        providerPaymentId: `mock_payment_${Date.now()}`,
        signature: "mock_signature",
      }, customerAuth.accessToken)

      setPaymentSuccessMessage(
        `Payment recorded for ${verified.item.orderNumber}. Redirecting to the order summary.`
      )

      window.setTimeout(() => {
        setIsPaymentDialogOpen(false)
        void routeAfterPayment(
          verified.item.id,
          verified.item.shippingAddress.email,
          verified.item.orderNumber
        )
      }, 900)
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Failed to confirm the payment."
      )
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <StorefrontLayout showCategoryMenu={false}>
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 pt-8 pb-12 sm:px-6 lg:px-8">
          <Card className="rounded-[2.1rem] border-[#dfd1c1] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,242,234,0.86))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.18)]">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Checkout
                </p>
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  There is nothing ready for checkout yet.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Add products to the bag first, then come back here for delivery,
                  payment, and the final order review.
                </p>
              </div>
              <Button asChild className="w-fit rounded-full px-5">
                <Link to={storefrontPaths.cart()}>
                  Return to cart
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout showCategoryMenu={false}>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(225,203,178,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.78),transparent_28%),linear-gradient(180deg,rgba(249,245,239,0.72),transparent_70%)]" />
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 pt-8 pb-14 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Checkout
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-[2.6rem]">
              Delivery, payment, and final review.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              The checkout now follows the same softer storefront language as the cart:
              cleaner spacing, warmer borders, and a calmer order summary that stays
              visible while you finish the order.
            </p>
          </div>

          {error ? (
            <Alert variant="destructive" className="border-red-200/70 bg-red-50/80">
              <AlertTitle>Checkout needs attention</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-start">
            <section className="space-y-5">
              <Card className="rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,247,242,0.92))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.18)]">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-muted-foreground" />
                        <h2 className="text-[1.65rem] font-semibold tracking-tight text-foreground">
                          Delivery address
                        </h2>
                      </div>
                      <div className="text-sm leading-6 text-muted-foreground">
                        <p>Saved delivery addresses</p>
                        <p>
                          Select the address for this shipment or add a fresh delivery
                          location.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl border-[#ddd1c2] bg-white/85 px-4 text-[#2f241d] hover:border-[#d0c0ae] hover:bg-white"
                      onClick={openAddressDialog}
                    >
                      <Plus className="size-4" />
                      Add new address
                    </Button>
                  </div>

                  {deliveryAddresses.length === 0 ? (
                    <div className="rounded-[1.45rem] border border-dashed border-[#e4d7c9] bg-[#fffdfa] px-4 py-5 text-sm text-muted-foreground">
                      No delivery address has been saved yet. Add one to continue
                      checkout.
                    </div>
                  ) : (
                    <RadioGroup
                      value={selectedAddressKey ?? ""}
                      onValueChange={setSelectedAddressKey}
                      className="grid gap-3"
                    >
                      {deliveryAddresses.map((address) => {
                        const active = address.key === selectedAddressKey
                        const incomplete = !address.isComplete

                        return (
                          <label
                            key={address.key}
                            className={cn(
                              "flex cursor-pointer gap-4 rounded-[1.55rem] border px-4 py-4 transition",
                              active
                                ? "border-[#d0baa4] bg-[#fffdfa] shadow-[0_18px_34px_-28px_rgba(48,31,19,0.16)]"
                                : "border-[#e6d9cb] bg-white/90 hover:border-[#d8c7b7] hover:bg-white",
                              incomplete &&
                                "border-[#eadbc8] bg-[linear-gradient(180deg,rgba(255,251,246,0.98),rgba(249,243,235,0.95))]"
                            )}
                          >
                            <RadioGroupItem
                              value={address.key}
                              className="mt-1 size-4 border-[#ccb8a5] bg-white text-white data-checked:border-[#8b5e34] data-checked:bg-[#8b5e34]"
                            />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold tracking-tight text-foreground">
                                  {address.label}
                                </span>
                                {address.isDefault ? (
                                  <span className="rounded-full border border-[#cce4d1] bg-[#e7f5ea] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f7a46]">
                                    Default
                                  </span>
                                ) : null}
                                {incomplete ? (
                                  <span className="rounded-full border border-[#ead8b7] bg-[#fbf2dd] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6a2f]">
                                    Incomplete
                                  </span>
                                ) : null}
                              </div>
                              <div className="grid gap-1 text-sm leading-6 text-muted-foreground">
                                <p className="font-medium text-foreground">{address.fullName}</p>
                                <p>{address.phoneNumber}</p>
                                <p>
                                  {address.line1}
                                  {address.line2 ? `, ${address.line2}` : ""}
                                </p>
                                <p>
                                  {address.city}, {address.state}, {address.country}{" "}
                                  {address.pincode}
                                </p>
                                {incomplete ? (
                                  <p className="text-[#8c6a2f]">
                                    Complete this saved address or add a new one before paying.
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {active ? (
                              <div className="hidden self-start rounded-full bg-[#f2e4d1] p-2 text-[#8b5e34] sm:block">
                                <Check className="size-4" />
                              </div>
                            ) : null}
                          </label>
                        )
                      })}
                    </RadioGroup>
                  )}

                  <div className="rounded-[1.55rem] border border-[#e6d9cb] bg-[linear-gradient(180deg,#fffdfa,#fbf7f1)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="checkout-contact-email"
                          className="text-sm font-semibold text-foreground"
                        >
                          Contact email
                        </Label>
                        <Input
                          id="checkout-contact-email"
                          type="email"
                          value={contactEmail}
                          onChange={(event) => setContactEmail(event.target.value)}
                          className="h-12 rounded-2xl border-[#e1d4c6] bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="checkout-order-note"
                          className="text-sm font-semibold text-foreground"
                        >
                          Order note
                        </Label>
                        <Textarea
                          id="checkout-order-note"
                          value={orderNote}
                          onChange={(event) => setOrderNote(event.target.value)}
                          rows={3}
                          className="min-h-[110px] rounded-2xl border-[#e1d4c6] bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(251,247,242,0.92))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.18)]">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-muted-foreground" />
                      <h2 className="text-[1.65rem] font-semibold tracking-tight text-foreground">
                        Delivery preference
                      </h2>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Choose how fast the order should arrive and how the package should
                      be handled.
                    </p>
                  </div>
                  <RadioGroup
                    value={selectedDeliveryPreference}
                    onValueChange={setSelectedDeliveryPreference}
                    className="grid gap-3"
                  >
                    {deliveryPreferences.map((option) => (
                      <ChoiceCard
                        key={option.id}
                        value={option.id}
                        title={option.label}
                        description={option.description}
                        active={selectedDeliveryPreference === option.id}
                        onSelect={setSelectedDeliveryPreference}
                      />
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(251,247,242,0.92))] py-0 shadow-[0_24px_60px_-44px_rgba(48,31,19,0.18)]">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <h2 className="text-[1.65rem] font-semibold tracking-tight text-foreground">
                        Payment method
                      </h2>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Choose how the payment should open once the order details are ready.
                    </p>
                  </div>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={(value) => {
                      const nextOption = paymentOptions.find((option) => option.id === value)
                      if (!nextOption?.enabled) {
                        return
                      }

                      setSelectedPaymentMethod(value)
                    }}
                    className="grid gap-3"
                  >
                    {paymentOptions.map((option) => (
                      <ChoiceCard
                        key={option.id}
                        value={option.id}
                        title={option.label}
                        description={option.description}
                        active={selectedPaymentMethod === option.id}
                        disabled={!option.enabled}
                        onSelect={setSelectedPaymentMethod}
                      />
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </section>

            <aside className="lg:sticky lg:top-24">
              <Card className="rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,246,240,0.94))] py-0 shadow-[0_28px_70px_-46px_rgba(48,31,19,0.2)]">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="space-y-2">
                    <h2 className="text-[2rem] font-semibold tracking-tight text-foreground">
                      Order summary
                    </h2>
                    <p className="text-sm leading-7 text-muted-foreground">
                      A quick view of the garments in this order, delivery charges, and
                      the final payable total.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex gap-4 rounded-[1.5rem] border border-[#e6d9cb] bg-white/92 p-3 shadow-[0_14px_26px_-24px_rgba(48,31,19,0.12)]"
                      >
                        <div className="w-20 shrink-0 rounded-[1.25rem] border border-[#e4d6c8] bg-[linear-gradient(180deg,#f8f1e9,#fcf8f3)] p-1.5">
                          <div className="overflow-hidden rounded-[0.95rem] border border-white/90 bg-white shadow-[inset_0_0_0_1px_rgba(223,208,192,0.8)]">
                            <img
                              src={resolveStorefrontImageUrl(item.imageUrl, item.name)}
                              alt={item.name}
                              className="aspect-[4/4.6] w-full object-cover"
                              onError={(event) =>
                                handleStorefrontImageError(event, item.name)
                              }
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="line-clamp-2 text-base font-medium tracking-tight text-foreground">
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Selected style / Qty {item.quantity}
                          </p>
                          <CommercePrice amount={item.unitPrice * item.quantity} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalSavings > 0 ? (
                    <div className="rounded-[1.4rem] border border-[#cce4d1] bg-[#e7f5ea] px-4 py-3 text-sm text-[#2f7a46]">
                      You are saving {formatCurrency(totalSavings)} on this order.
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <CheckoutSummaryRow
                      label="Subtotal"
                      value={<CommercePrice amount={cart.subtotalAmount} className="justify-end" />}
                    />
                    <CheckoutSummaryRow
                      label="Shipping"
                      value={
                        shippingAmount === 0 ? (
                          <span className="font-medium">Free</span>
                        ) : (
                          <CommercePrice amount={shippingAmount} className="justify-end" />
                        )
                      }
                    />
                    <CheckoutSummaryRow
                      label="Handling"
                      value={<CommercePrice amount={handlingAmount} className="justify-end" />}
                    />
                    <CheckoutSummaryRow
                      label="Payment"
                      value={
                        <span className="font-medium">{selectedPaymentOption.summaryLabel}</span>
                      }
                    />
                    <CheckoutSummaryRow
                      label="Total"
                      emphasized
                      value={<CommercePrice amount={totalAmount} className="justify-end" />}
                    />
                  </div>

                  <Button
                    className="h-12 w-full rounded-full bg-[#201712] text-white hover:bg-[#31231b]"
                    size="lg"
                    disabled={
                      isSubmitting ||
                      isLoadingLookups ||
                      !selectedAddress ||
                      !selectedAddressIsComplete ||
                      !isValidEmail(contactEmail)
                    }
                    onClick={() => void handlePlaceOrder()}
                  >
                    {isSubmitting ? "Processing..." : "Continue to pay"}
                  </Button>

                  {!selectedAddressIsComplete ? (
                    <div className="rounded-[1.2rem] border border-[#ead8b7] bg-[#fbf2dd] px-4 py-3 text-sm text-[#8c6a2f]">
                      Select a complete delivery address or add a new one to continue to payment.
                    </div>
                  ) : null}

                  <div className="grid gap-3 text-sm">
                    <div className="flex items-start gap-3 rounded-[1.2rem] border border-[#e8ddd2] bg-[#fcfaf7] p-3">
                      <PackageCheck className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Delivery preview</p>
                        <p className="mt-1 leading-6 text-muted-foreground">
                          {selectedDeliveryOption.label} keeps the summary totals aligned
                          with your selected shipment style.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-[1.2rem] border border-[#e8ddd2] bg-[#fcfaf7] p-3">
                      <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Secure checkout</p>
                        <p className="mt-1 leading-6 text-muted-foreground">
                          Address confirmation, payment, and order verification stay inside
                          the secure storefront payment flow.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-[1.2rem] border border-[#e8ddd2] bg-[#fcfaf7] p-3">
                      <Sparkles className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Storefront matched</p>
                        <p className="mt-1 leading-6 text-muted-foreground">
                          Borders, spacing, and the summary surface now follow the same
                          warm storefront composition as the cart page.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          if (isConfirmingPayment) {
            return
          }

          setIsPaymentDialogOpen(open)

          if (!open && !paymentSuccessMessage) {
            setPendingPaymentCheckout(null)
          }
        }}
      >
        <DialogContent className="w-[min(92vw,32rem)] gap-5 rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(252,248,243,0.96))] p-0 shadow-[0_36px_90px_-52px_rgba(48,31,19,0.28)]">
          <DialogHeader className="border-b border-[#efe4d8] px-6 pt-6 pb-5">
            <DialogTitle className="text-[1.6rem] tracking-tight">
              Complete payment
            </DialogTitle>
            <DialogDescription>
              Temporary storefront payment popup for local checkout testing before the
              live gateway is re-enabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 pb-6">
            <div className="rounded-[1.45rem] border border-[#e6d9cb] bg-[#fffdfa] p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Order</span>
                <span className="font-medium text-foreground">
                  {pendingPaymentCheckout?.orderNumber ?? "-"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-base font-semibold">
                <span className="text-foreground">Amount to pay</span>
                <CommercePrice
                  amount={pendingPaymentCheckout?.totalAmount ?? 0}
                  className="justify-end"
                />
              </div>
            </div>

            {paymentSuccessMessage ? (
              <div className="rounded-[1.4rem] border border-[#cce4d1] bg-[#e7f5ea] px-4 py-3 text-sm text-[#2f7a46]">
                {paymentSuccessMessage}
              </div>
            ) : null}

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-mobile-number">Mobile number</Label>
                <Input
                  id="payment-mobile-number"
                  value={paymentMobileNumber}
                  onChange={(event) => setPaymentMobileNumber(event.target.value)}
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-contact-email">Email</Label>
                <Input
                  id="payment-contact-email"
                  type="email"
                  value={paymentContactEmail}
                  onChange={(event) => setPaymentContactEmail(event.target.value)}
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-[#ddd1c2] bg-white/85 px-5 text-[#2f241d] hover:border-[#d0c0ae] hover:bg-white"
                onClick={() => {
                  setIsPaymentDialogOpen(false)
                  if (!paymentSuccessMessage) {
                    setPendingPaymentCheckout(null)
                  }
                }}
                disabled={isConfirmingPayment}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-[#201712] px-5 text-white hover:bg-[#31231b]"
                onClick={() => void handleCompleteDummyPayment()}
                disabled={isConfirmingPayment || Boolean(paymentSuccessMessage)}
              >
                {isConfirmingPayment ? "Processing..." : "Pay now"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="w-[min(94vw,58rem)] gap-5 rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(252,248,243,0.96))] p-0 shadow-[0_36px_90px_-52px_rgba(48,31,19,0.28)]">
          <DialogHeader className="border-b border-[#efe4d8] px-6 pt-6 pb-5">
            <DialogTitle className="text-[1.75rem] tracking-tight">
              Add delivery address
            </DialogTitle>
            <DialogDescription>
              Save a complete delivery address once and reuse it for future orders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 pb-6">
            {addressDialogError ? (
              <div className="flex items-start gap-3 rounded-[1.25rem] border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-950">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{addressDialogError}</span>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery-address-label">Address label</Label>
                <Input
                  id="delivery-address-label"
                  value={addressDialogState.label}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-address-phone">Phone</Label>
                <Input
                  id="delivery-address-phone"
                  value={addressDialogState.phoneNumber}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-address-first-name">First name</Label>
                <Input
                  id="delivery-address-first-name"
                  value={addressDialogState.firstName}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-address-last-name">Last name</Label>
                <Input
                  id="delivery-address-last-name"
                  value={addressDialogState.lastName}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="delivery-address-line1">Address line 1</Label>
                <Textarea
                  id="delivery-address-line1"
                  rows={3}
                  value={addressDialogState.line1}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      line1: event.target.value,
                    }))
                  }
                  className="rounded-xl border-[#e1d4c6] bg-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="delivery-address-line2">Address line 2</Label>
                <Input
                  id="delivery-address-line2"
                  value={addressDialogState.line2}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      line2: event.target.value,
                    }))
                  }
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
              </div>

              {lookupState.countries.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <SearchableLookupField
                      value={addressDialogState.countryId}
                      onValueChange={(value) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          countryId: value,
                          stateId: "1",
                          cityId: "1",
                          pincodeId: "1",
                        }))
                      }
                      options={lookupState.countries.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "countries"),
                      }))}
                      placeholder="Search country"
                      searchPlaceholder="Search country"
                      noResultsMessage="No country found."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <SearchableLookupField
                      value={addressDialogState.stateId}
                      onValueChange={(value) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          stateId: value,
                          cityId: "1",
                          pincodeId: "1",
                        }))
                      }
                      options={filteredStateOptions.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "states"),
                      }))}
                      placeholder="Search state"
                      searchPlaceholder="Search state"
                      noResultsMessage="No state found."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <SearchableLookupField
                      value={addressDialogState.cityId}
                      onValueChange={(value) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          cityId: value,
                          pincodeId: "1",
                        }))
                      }
                      options={filteredCityOptions.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "cities"),
                      }))}
                      placeholder="Search city"
                      searchPlaceholder="Search city"
                      noResultsMessage="No city found."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal code</Label>
                    <SearchableLookupField
                      value={addressDialogState.pincodeId}
                      onValueChange={(value) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          pincodeId: value,
                        }))
                      }
                      options={filteredPincodeOptions.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "pincodes"),
                      }))}
                      placeholder="Search postal code"
                      searchPlaceholder="Search postal code"
                      noResultsMessage="No postal code found."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-address-country">Country</Label>
                    <Input
                      id="delivery-address-country"
                      value={addressDialogState.country}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          country: event.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-address-state">State</Label>
                    <Input
                      id="delivery-address-state"
                      value={addressDialogState.state}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          state: event.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-address-city">City</Label>
                    <Input
                      id="delivery-address-city"
                      value={addressDialogState.city}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-address-pincode">Postal code</Label>
                    <Input
                      id="delivery-address-pincode"
                      value={addressDialogState.pincode}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          pincode: event.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-[1.25rem] border border-[#ece2d6] bg-[#fffdfa] px-4 py-3">
              <Checkbox
                id="delivery-address-default"
                checked={addressDialogState.setAsDefault}
                onCheckedChange={(value) =>
                  updateAddressDialogState((current) => ({
                    ...current,
                    setAsDefault: Boolean(value),
                  }))
                }
                className="border-[#ccb8a5] data-[state=checked]:border-[#2f7a46] data-[state=checked]:bg-[#2f7a46]"
              />
              <Label htmlFor="delivery-address-default" className="cursor-pointer">
                Set as default delivery address
              </Label>
            </div>

            {isLoadingLookups ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading country, state, city, and postal lookups.
              </div>
            ) : null}

            {!customerAuth.isAuthenticated ? (
              <div className="flex items-start gap-3 rounded-[1.25rem] border border-[#ece2d6] bg-[#fcfaf7] px-4 py-3 text-sm text-muted-foreground">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>
                  Guest checkout can use this address for the current order. Sign in to
                  keep addresses in your customer profile for future reuse.
                </span>
              </div>
            ) : null}

            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-[#ddd1c2] bg-white/85 px-5 text-[#2f241d] hover:border-[#d0c0ae] hover:bg-white"
                onClick={() => setIsAddressDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-[#201712] px-5 text-white hover:bg-[#31231b]"
                disabled={isSavingAddress || isLoadingLookups}
                onClick={() => void handleSaveAddress()}
              >
                {isSavingAddress ? "Saving..." : "Save address"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </StorefrontLayout>
  )
}
