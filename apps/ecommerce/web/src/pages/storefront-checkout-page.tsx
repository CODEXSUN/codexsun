import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
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
import { Link } from "react-router-dom"

import type { CommonModuleItem, ContactAddressInput } from "@core/shared"
import type {
  CustomerProfileLookupResponse,
  StorefrontCheckoutPaymentMethod,
  StorefrontFulfillmentMethod,
  StorefrontSettings,
} from "@ecommerce/shared"

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
import { queryKeys } from "@cxapp/web/src/query/query-keys"

import { storefrontApi } from "../api/storefront-api"
import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { useStorefrontCart } from "../cart/storefront-cart"
import { StorefrontLayout } from "../components/storefront-layout"
import {
  handleStorefrontImageError,
  resolveStorefrontImageUrl,
} from "../lib/storefront-image"
import { calculateStorefrontChargeTotals } from "../lib/storefront-shipping"
import { loadRazorpayCheckoutScript } from "../lib/load-razorpay"
import { storefrontPaths } from "../lib/storefront-routes"

type CheckoutAddressState = {
  fullName: string
  email: string
  phoneNumber: string
  line1: string
  line2: string
  city: string
  district: string
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
  addressTypeId: string | null
  countryId: string | null
  stateId: string | null
  districtId: string | null
  cityId: string | null
  pincodeId: string | null
  isDefault: boolean
  isComplete: boolean
}

type AddressDialogField =
  | "label"
  | "phoneNumber"
  | "firstName"
  | "line1"
  | "countryId"
  | "stateId"
  | "districtId"
  | "cityId"
  | "pincodeId"

type AddressDialogFieldErrors = Partial<Record<AddressDialogField, string>>

type AddressDialogState = {
  label: string
  firstName: string
  lastName: string
  phoneNumber: string
  line1: string
  line2: string
  countryId: string
  stateId: string
  districtId: string
  cityId: string
  pincodeId: string
  country: string
  state: string
  district: string
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

type CompletedCheckoutState = {
  orderId: string
  orderNumber: string
  shippingEmail: string
  paymentStatusLabel: string
  summary: string
}

type RetryablePaymentSession = {
  attemptKey: string
  orderId: string
  orderNumber: string
  providerOrderId: string
  keyId: string | null
  amount: number
  currency: string
  shippingEmail: string
  businessName: string
  checkoutImage: string | null
  themeColor: string | null
  customerEmail: string
  customerPhoneNumber: string
}

type CheckoutPaymentFailureKind = "dismissed" | "failed"

const fallbackStorefrontSettings: Pick<
  StorefrontSettings,
  "freeShippingThreshold" | "defaultShippingAmount" | "defaultHandlingAmount" | "pickupLocation"
> = {
  freeShippingThreshold: 3999,
  defaultShippingAmount: 149,
  defaultHandlingAmount: 99,
  pickupLocation: {
    enabled: false,
    title: "Store pickup available",
    summary: "",
    storeName: "",
    line1: "",
    line2: null,
    city: "",
    state: "",
    country: "India",
    pincode: "",
    contactPhone: "",
    contactEmail: "storefront@codexsun.local",
    pickupNote: "",
  },
}
const addressDraftDefaults: Omit<
  AddressDialogState,
  "firstName" | "lastName" | "phoneNumber" | "countryId"
> = {
  label: "Home",
  line1: "",
  line2: "",
  stateId: "1",
  districtId: "1",
  cityId: "1",
  pincodeId: "1",
  country: "India",
  state: "",
  district: "",
  city: "",
  pincode: "",
  setAsDefault: true,
}
const deliveryPreferences: DeliveryPreference[] = [
  {
    id: "standard",
    label: "Standard delivery",
    description: "Balanced dispatch window for the regular storefront flow.",
    shippingAmount: 0,
    handlingAmount: 0,
  },
  {
    id: "priority",
    label: "Priority delivery",
    description: "Faster delivery preference for urgent orders.",
    shippingAmount: 0,
    handlingAmount: 0,
  },
  {
    id: "signature",
    label: "Signature packaging",
    description: "Occasion-ready packaging preference with a premium handoff.",
    shippingAmount: 0,
    handlingAmount: 0,
  },
  {
    id: "store-pickup",
    label: "Store pickup",
    description: "Reserve the order and collect it from the configured retail pickup location.",
    shippingAmount: 0,
    handlingAmount: 0,
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

function createGuestLookupOption(
  module: "countries" | "states" | "districts" | "cities" | "pincodes",
  label: string,
  references: Partial<Record<"country_id" | "state_id" | "district_id" | "city_id", string>>
) {
  const trimmedLabel = label.trim()
  const normalizedLabel =
    module === "pincodes" ? trimmedLabel.replace(/\s+/g, "") : trimmedLabel
  const timestamp = new Date().toISOString()

  return {
    id: `guest-${module}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    name: normalizedLabel,
    label: normalizedLabel,
    ...(module === "pincodes"
      ? { code: normalizedLabel, area_name: normalizedLabel }
      : { code: normalizedLabel.toUpperCase().replace(/\s+/g, "-") }),
    ...references,
  } satisfies CommonModuleItem
}

function upsertLookupItem(
  items: CommonModuleItem[],
  nextItem: CommonModuleItem,
  module: keyof CheckoutLookupState
) {
  const nextLabel = getCommonModuleLabel(nextItem, module)
    .trim()
    .toLowerCase()

  const existingIndex = items.findIndex((item) => {
    const currentLabel = getCommonModuleLabel(item, module).trim().toLowerCase()

    return item.id === nextItem.id || currentLabel === nextLabel
  })

  if (existingIndex === -1) {
    return [...items, nextItem]
  }

  return items.map((item, index) => (index === existingIndex ? nextItem : item))
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

function createAddressDialogStateFromOption(
  address: DeliveryAddressOption,
  defaultCountryId: string
) {
  const { firstName, lastName } = splitDisplayName(address.fullName)

  return {
    label: address.label,
    firstName,
    lastName,
    phoneNumber: address.phoneNumber,
    line1: address.line1,
    line2: address.line2,
    countryId: address.countryId ?? defaultCountryId,
    stateId: address.stateId ?? "1",
    districtId: address.districtId ?? "1",
    cityId: address.cityId ?? "1",
    pincodeId: address.pincodeId ?? "1",
    country: address.country,
    state: address.state,
    district: address.district,
    city: address.city,
    pincode: address.pincode,
    setAsDefault: address.isDefault,
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
  return <StorefrontCheckoutContent />
}

export function StorefrontCheckoutContent({
  embedded = false,
  cartHref,
}: {
  embedded?: boolean
  cartHref?: string
}) {
  const queryClient = useQueryClient()
  const cart = useStorefrontCart()
  const customerAuth = useStorefrontCustomerAuth()
  const resolvedCartHref = cartHref ?? storefrontPaths.cart()
  const [storefrontSettings, setStorefrontSettings] = useState(fallbackStorefrontSettings)
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
  const [editingAddressKey, setEditingAddressKey] = useState<string | null>(null)
  const [addressDialogState, setAddressDialogState] = useState<AddressDialogState>(() =>
    createAddressDialogState({
      displayName: null,
      phoneNumber: null,
      defaultCountryId: "1",
    })
  )
  const [addressDialogError, setAddressDialogError] = useState<string | null>(null)
  const [addressDialogFieldErrors, setAddressDialogFieldErrors] =
    useState<AddressDialogFieldErrors>({})
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [completedCheckout, setCompletedCheckout] =
    useState<CompletedCheckoutState | null>(null)
  const [retryablePaymentSession, setRetryablePaymentSession] =
    useState<RetryablePaymentSession | null>(null)
  const [paymentFailureKind, setPaymentFailureKind] =
    useState<CheckoutPaymentFailureKind | null>(null)

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

    async function loadPublicSettings() {
      try {
        const settings = await storefrontApi.getPublicStorefrontSettings()

        if (!cancelled) {
          setStorefrontSettings({
            freeShippingThreshold: settings.freeShippingThreshold,
            defaultShippingAmount: settings.defaultShippingAmount,
            defaultHandlingAmount: settings.defaultHandlingAmount,
            pickupLocation: settings.pickupLocation,
          })
        }
      } catch {
        if (!cancelled) {
          setStorefrontSettings(fallbackStorefrontSettings)
        }
      }
    }

    void loadPublicSettings()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      setIsLoadingLookups(true)

      try {
        const response =
          customerAuth.accessToken && customerAuth.isAuthenticated
            ? await storefrontApi.getCustomerProfileLookups(customerAuth.accessToken)
            : await storefrontApi.getGuestCheckoutLookups()

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
          addressTypeId: address.addressTypeId ?? null,
          fullName: customerAuth.customer?.displayName ?? "",
          email: customerAuth.customer?.email ?? contactEmail,
          phoneNumber: customerAuth.customer?.phoneNumber ?? "",
          line1: address.addressLine1,
          line2: address.addressLine2 ?? "",
          countryId: address.countryId ?? null,
          stateId: address.stateId ?? null,
          districtId: address.districtId ?? null,
          cityId: address.cityId ?? null,
          pincodeId: address.pincodeId ?? null,
          district: resolveLookupLabel(lookupState.districts, address.districtId, "districts"),
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
    lookupState.districts,
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
  const addressDialogErrorMessages = Object.values(addressDialogFieldErrors).filter(Boolean)
  const isStorePickup = selectedDeliveryPreference === "store-pickup"
  const availableDeliveryPreferences = useMemo(
    () =>
      deliveryPreferences.filter((option) =>
        option.id === "store-pickup" ? storefrontSettings.pickupLocation.enabled : true
      ),
    [storefrontSettings.pickupLocation.enabled]
  )
  const availablePaymentOptions = useMemo(() => {
    if (!isStorePickup) {
      return paymentOptions
    }

    return [
      {
        id: "upi-wallet",
        label: "Pay online now",
        description: "Pay online now and collect the order from the store counter later.",
        summaryLabel: "Online pickup payment",
        enabled: true,
      },
      {
        id: "pay-at-store",
        label: "Pay at store pickup",
        description: "Reserve the order now and complete payment when you arrive at the retail store.",
        summaryLabel: "Pay at store",
        enabled: true,
      },
    ] satisfies PaymentOption[]
  }, [isStorePickup])
  const selectedDeliveryOption =
    availableDeliveryPreferences.find((option) => option.id === selectedDeliveryPreference) ??
    availableDeliveryPreferences[0]
  const selectedPaymentOption =
    availablePaymentOptions.find((option) => option.id === selectedPaymentMethod) ??
    availablePaymentOptions[0]
  const checkoutAttemptKey = useMemo(() => {
    const cartSignature = cart.items
      .map((item) => `${item.productId}:${item.quantity}`)
      .sort()
      .join("|")

    return [
      selectedAddressKey ?? "",
      contactEmail.trim().toLowerCase(),
      selectedDeliveryPreference,
      selectedPaymentMethod,
      orderNote.trim(),
      cartSignature,
    ].join("::")
  }, [
    cart.items,
    contactEmail,
    orderNote,
    selectedAddressKey,
    selectedDeliveryPreference,
    selectedPaymentMethod,
  ])
  const canRetryPayment =
    retryablePaymentSession?.attemptKey === checkoutAttemptKey

  useEffect(() => {
    if (
      selectedDeliveryPreference === "store-pickup" &&
      !storefrontSettings.pickupLocation.enabled
    ) {
      setSelectedDeliveryPreference("standard")
    }
  }, [selectedDeliveryPreference, storefrontSettings.pickupLocation.enabled])

  useEffect(() => {
    if (!availablePaymentOptions.some((option) => option.id === selectedPaymentMethod)) {
      setSelectedPaymentMethod(availablePaymentOptions[0]?.id ?? "upi-wallet")
    }
  }, [availablePaymentOptions, selectedPaymentMethod])

  const { shippingAmount, handlingAmount } = calculateStorefrontChargeTotals(
    cart.items,
    storefrontSettings,
    cart.subtotalAmount
  )
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
  const filteredDistrictOptions = useMemo(
    () =>
      filterLookupItems(lookupState.districts, [
        { field: "state_id", value: addressDialogState.stateId },
      ]),
    [addressDialogState.stateId, lookupState.districts]
  )
  const filteredCityOptions = useMemo(
    () =>
      filterLookupItems(lookupState.cities, [
        { field: "state_id", value: addressDialogState.stateId },
        { field: "district_id", value: addressDialogState.districtId },
      ]),
    [addressDialogState.districtId, addressDialogState.stateId, lookupState.cities]
  )
  const filteredPincodeOptions = useMemo(
    () =>
      filterLookupItems(lookupState.pincodes, [
        { field: "state_id", value: addressDialogState.stateId },
        { field: "district_id", value: addressDialogState.districtId },
        { field: "city_id", value: addressDialogState.cityId },
      ]),
    [
      addressDialogState.cityId,
      addressDialogState.districtId,
      addressDialogState.stateId,
      lookupState.pincodes,
    ]
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
    if (
      !isAddressDialogOpen ||
      addressDialogState.districtId !== "1" ||
      filteredDistrictOptions.length === 0
    ) {
      return
    }

    setAddressDialogState((current) => ({
      ...current,
      districtId: filteredDistrictOptions[0]!.id,
    }))
  }, [
    addressDialogState.districtId,
    filteredDistrictOptions,
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

  function openAddressDialog(address?: DeliveryAddressOption | null) {
    setAddressDialogError(null)
    setAddressDialogFieldErrors({})
    setEditingAddressKey(address?.key ?? null)
    setAddressDialogState(
      address
        ? createAddressDialogStateFromOption(address, defaultCountryId)
        : createAddressDialogState({
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
    setAddressDialogError(null)
    setAddressDialogFieldErrors({})
    setAddressDialogState((current) => recipe(current))
  }

  function createGuestAddressLookup(
    module: "countries" | "states" | "districts" | "cities" | "pincodes",
    query: string
  ) {
    if (customerAuth.isAuthenticated) {
      return
    }

    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      return
    }

    const references = {
      country_id: addressDialogState.countryId,
      state_id: addressDialogState.stateId,
      district_id: addressDialogState.districtId,
      city_id: addressDialogState.cityId,
    }

    const nextItem = createGuestLookupOption(module, trimmedQuery, {
      ...(module === "states" ? { country_id: references.country_id } : {}),
      ...(module === "districts" ? { state_id: references.state_id } : {}),
      ...(module === "cities"
        ? { state_id: references.state_id, district_id: references.district_id }
        : {}),
      ...(module === "pincodes"
        ? {
            state_id: references.state_id,
            district_id: references.district_id,
            city_id: references.city_id,
          }
        : {}),
    })

    setLookupState((current) => ({
      ...current,
      [module]: upsertLookupItem(current[module], nextItem, module),
    }))

    setAddressDialogState((current) => {
      if (module === "countries") {
        return {
          ...current,
          countryId: nextItem.id,
          country: trimmedQuery,
          stateId: "1",
          districtId: "1",
          cityId: "1",
          pincodeId: "1",
          state: "",
          district: "",
          city: "",
          pincode: "",
        }
      }

      if (module === "states") {
        return {
          ...current,
          stateId: nextItem.id,
          state: trimmedQuery,
          districtId: "1",
          cityId: "1",
          pincodeId: "1",
          district: "",
          city: "",
          pincode: "",
        }
      }

      if (module === "districts") {
        return {
          ...current,
          districtId: nextItem.id,
          district: trimmedQuery,
          cityId: "1",
          pincodeId: "1",
          city: "",
          pincode: "",
        }
      }

      if (module === "cities") {
        return {
          ...current,
          cityId: nextItem.id,
          city: trimmedQuery,
          pincodeId: "1",
          pincode: "",
        }
      }

      return {
        ...current,
        pincodeId: nextItem.id,
        pincode: trimmedQuery,
      }
    })
  }

  function validateAddressDialog() {
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
    const districtLabel =
      resolveLookupLabel(lookupState.districts, addressDialogState.districtId, "districts") ||
      addressDialogState.district.trim()
    const cityLabel =
      resolveLookupLabel(lookupState.cities, addressDialogState.cityId, "cities") ||
      addressDialogState.city.trim()
    const pincodeLabel =
      resolveLookupLabel(lookupState.pincodes, addressDialogState.pincodeId, "pincodes") ||
      addressDialogState.pincode.trim()

    const errors: AddressDialogFieldErrors = {}

    if (!addressDialogState.label.trim()) {
      errors.label = "Address label is required."
    }
    if (!addressDialogState.firstName.trim()) {
      errors.firstName = "First name is required."
    }
    if (!addressDialogState.phoneNumber.trim()) {
      errors.phoneNumber = "Phone is required."
    }
    if (!addressDialogState.line1.trim()) {
      errors.line1 = "Address line 1 is required."
    }
    if (!countryLabel) {
      errors.countryId = "Country is required."
    }
    if (!stateLabel) {
      errors.stateId = "State is required."
    }
    if (!districtLabel) {
      errors.districtId = "District is required."
    }
    if (!cityLabel) {
      errors.cityId = "City is required."
    }
    if (!pincodeLabel) {
      errors.pincodeId = "Postal code is required."
    }

    return {
      fullName,
      countryLabel,
      stateLabel,
      districtLabel,
      cityLabel,
      pincodeLabel,
      errors,
    }
  }

  async function finalizeCheckout(
    orderId: string,
    shippingEmail: string,
    orderNumber: string,
    paymentStatusLabel = "Paid and confirmed",
    summary = "Your payment was captured successfully and the order is now in your account flow."
  ) {
    setRetryablePaymentSession(null)
    setPaymentFailureKind(null)
    cart.clear()

    if (customerAuth.isAuthenticated) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.storefrontCustomerPortal }),
        queryClient.invalidateQueries({ queryKey: queryKeys.storefrontCustomerOrders }),
      ])
      await customerAuth.refresh()
      setCompletedCheckout({
        orderId,
        orderNumber,
        shippingEmail,
        paymentStatusLabel,
        summary,
      })
      return
    }

    setCompletedCheckout({
      orderId,
      orderNumber,
      shippingEmail,
      paymentStatusLabel,
      summary,
    })
  }

  async function handleSaveAddress() {
    const {
      fullName,
      countryLabel,
      stateLabel,
      districtLabel,
      cityLabel,
      pincodeLabel,
      errors,
    } = validateAddressDialog()

    if (Object.keys(errors).length > 0) {
      setAddressDialogFieldErrors(errors)
      setAddressDialogError("Complete the missing address fields before saving.")
      return
    }

    const nextAddress: DeliveryAddressOption = {
      key: editingAddressKey ?? `temp-${Date.now()}`,
      label: addressDialogState.label.trim(),
      addressTypeId: resolveAddressTypeId(addressDialogState.label, lookupState.addressTypes),
      fullName,
      email: contactEmail.trim(),
      phoneNumber: addressDialogState.phoneNumber.trim(),
      line1: addressDialogState.line1.trim(),
      line2: addressDialogState.line2.trim(),
      countryId: addressDialogState.countryId || "1",
      stateId: addressDialogState.stateId || "1",
      districtId: addressDialogState.districtId || "1",
      cityId: addressDialogState.cityId || "1",
      pincodeId: addressDialogState.pincodeId || "1",
      district: districtLabel,
      city: cityLabel,
      state: stateLabel,
      country: countryLabel,
      pincode: pincodeLabel,
      isDefault: addressDialogState.setAsDefault,
      isComplete: true,
    }

    setAddressDialogError(null)
    setAddressDialogFieldErrors({})
    setIsSavingAddress(true)

    try {
      if (customerAuth.isAuthenticated && customerAuth.customer) {
        const nextAddressInput = {
          addressTypeId: nextAddress.addressTypeId ?? "1",
          addressLine1: nextAddress.line1,
          addressLine2: nextAddress.line2 || "-",
          cityId: addressDialogState.cityId || "1",
          districtId: addressDialogState.districtId || "1",
          stateId: addressDialogState.stateId || "1",
          countryId: addressDialogState.countryId || "1",
          pincodeId: addressDialogState.pincodeId || "1",
          latitude: null,
          longitude: null,
          isDefault: addressDialogState.setAsDefault,
        } satisfies ContactAddressInput
        const isEditingSavedAddress = customerAuth.customer.addresses.some(
          (address) => address.id === editingAddressKey
        )
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
        const nextProfileAddresses = isEditingSavedAddress
          ? existingAddresses.map((address, index) => {
              const savedAddress = customerAuth.customer!.addresses[index]
              return savedAddress?.id === editingAddressKey ? nextAddressInput : address
            })
          : [...existingAddresses, nextAddressInput]

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

        if (isEditingSavedAddress) {
          setSelectedAddressKey(editingAddressKey)
          setAddressLabels((current) => ({
            ...current,
            [editingAddressKey as string]: nextAddress.label,
          }))
        } else {
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
        }
      } else {
        setTemporaryAddresses((current) => {
          const normalizedAddresses = current.map((address) => ({
            ...address,
            isDefault: addressDialogState.setAsDefault ? false : address.isDefault,
          }))
          const existingIndex = normalizedAddresses.findIndex(
            (address) => address.key === nextAddress.key
          )

          if (existingIndex === -1) {
            return [...normalizedAddresses, nextAddress]
          }

          return normalizedAddresses.map((address, index) =>
            index === existingIndex ? nextAddress : address
          )
        })
        setSelectedAddressKey(nextAddress.key)
      }

      setEditingAddressKey(null)
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
      openAddressDialog(selectedAddress)
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
    const fulfillmentMethod: StorefrontFulfillmentMethod = isStorePickup
      ? "store_pickup"
      : "delivery"
    const paymentMethod: StorefrontCheckoutPaymentMethod =
      isStorePickup && selectedPaymentMethod === "pay-at-store"
        ? "pay_at_store"
        : "online"

    setError(null)

    if (canRetryPayment && retryablePaymentSession) {
      await handleOpenRazorpayCheckout(retryablePaymentSession)
      return
    }

    setIsSubmitting(true)

    try {
      const checkout = await storefrontApi.createCheckout(customerAuth.accessToken, {
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        fulfillmentMethod,
        paymentMethod,
        shippingAddress: {
          ...shippingAddress,
          line2: shippingAddress.line2 || null,
        },
        billingAddress: {
          ...shippingAddress,
          line2: shippingAddress.line2 || null,
        },
        notes:
          [
            isStorePickup
              ? `Fulfillment: Store pickup from ${storefrontSettings.pickupLocation.storeName}`
              : null,
            paymentMethod === "pay_at_store" ? "Payment: Pay at store pickup" : null,
            orderNote.trim() || null,
          ]
            .filter(Boolean)
            .join(" | ") || null,
      })

      if (checkout.payment.mode === "offline") {
        setRetryablePaymentSession(null)
        setPaymentFailureKind(null)
        await finalizeCheckout(
          checkout.order.id,
          checkout.order.shippingAddress.email,
          checkout.order.orderNumber,
          "Reserved for pickup",
          `Your order is reserved at ${storefrontSettings.pickupLocation.storeName}. Payment will be collected when you arrive at the store.`
        )
      } else if (checkout.payment.mode === "live") {
        const nextPaymentSession = {
          attemptKey: checkoutAttemptKey,
          orderId: checkout.order.id,
          orderNumber: checkout.order.orderNumber,
          providerOrderId: checkout.payment.providerOrderId ?? "",
          keyId: checkout.payment.keyId,
          amount: checkout.payment.amount,
          currency: checkout.payment.currency,
          shippingEmail: checkout.order.shippingAddress.email,
          businessName: checkout.payment.businessName,
          checkoutImage: checkout.payment.checkoutImage,
          themeColor: checkout.payment.themeColor,
          customerEmail: shippingAddress.email,
          customerPhoneNumber: shippingAddress.phoneNumber,
        } satisfies RetryablePaymentSession

        setRetryablePaymentSession(nextPaymentSession)
        setPaymentFailureKind(null)
        await handleOpenRazorpayCheckout(nextPaymentSession)
      } else {
        setRetryablePaymentSession(null)
        setPaymentFailureKind(null)
        await handleCompleteDummyPayment({
          orderId: checkout.order.id,
          orderNumber: checkout.order.orderNumber,
          providerOrderId: checkout.payment.providerOrderId ?? "",
          shippingEmail: checkout.order.shippingAddress.email,
        })
      }
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

  async function verifyAndFinalizePayment(input: {
    orderId: string
    providerOrderId: string
    providerPaymentId: string
    signature: string
  }) {
    const verified = await storefrontApi.verifyCheckoutPayment(
      {
        orderId: input.orderId,
        providerOrderId: input.providerOrderId,
        providerPaymentId: input.providerPaymentId,
        signature: input.signature,
      },
      customerAuth.accessToken
    )

    await finalizeCheckout(
      verified.item.id,
      verified.item.shippingAddress.email,
      verified.item.orderNumber,
      verified.item.fulfillmentMethod === "store_pickup"
        ? "Paid, ready for pickup"
        : "Paid and confirmed",
      verified.item.fulfillmentMethod === "store_pickup" && verified.item.pickupLocation
        ? `Your order is paid and waiting for pickup at ${verified.item.pickupLocation.storeName}.`
        : "Your payment was captured successfully and the order is now in your account flow."
    )
  }

  async function handleCompleteDummyPayment(input: {
    orderId: string
    orderNumber: string
    providerOrderId: string
    shippingEmail: string
  }) {
    setError(null)
    setIsConfirmingPayment(true)

    try {
      await verifyAndFinalizePayment({
        orderId: input.orderId,
        providerOrderId: input.providerOrderId,
        providerPaymentId: `mock_payment_${Date.now()}`,
        signature: "mock_signature",
      })
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

  async function handleOpenRazorpayCheckout(input: {
    orderId: string
    orderNumber: string
    providerOrderId: string
    keyId: string | null
    amount: number
    currency: string
    shippingEmail: string
    businessName: string
    checkoutImage: string | null
    themeColor: string | null
    customerEmail: string
    customerPhoneNumber: string
  }) {
    if (!isValidEmail(input.customerEmail)) {
      setError("Enter a valid payment email before continuing.")
      return
    }

    if (!input.customerPhoneNumber.trim()) {
      setError("Enter a mobile number before continuing.")
      return
    }

    if (!input.keyId || !input.providerOrderId) {
      setError("Live Razorpay checkout is not configured for this order.")
      return
    }

    setError(null)
    setIsConfirmingPayment(true)
    setPaymentFailureKind(null)

    try {
      await loadRazorpayCheckoutScript()

      await new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error("Razorpay checkout is unavailable in this browser session."))
          return
        }

        const razorpay = new window.Razorpay({
          key: input.keyId,
          amount: input.amount,
          currency: input.currency,
          name: input.businessName,
          description: `Order ${input.orderNumber}`,
          image: input.checkoutImage ?? undefined,
          order_id: input.providerOrderId,
          prefill: {
            name: selectedAddress?.fullName || customerAuth.customer?.displayName || "Customer",
            email: input.customerEmail.trim(),
            contact: input.customerPhoneNumber.trim(),
          },
          notes: {
            storefrontOrderId: input.orderId,
            storefrontOrderNumber: input.orderNumber,
          },
          theme: input.themeColor
            ? { color: input.themeColor }
            : undefined,
          handler: async (response: {
            razorpay_order_id: string
            razorpay_payment_id: string
            razorpay_signature: string
          }) => {
            try {
              await verifyAndFinalizePayment({
                orderId: input.orderId,
                providerOrderId: response.razorpay_order_id,
                providerPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              })
              resolve()
            } catch (verificationError) {
              reject(verificationError)
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Razorpay checkout was closed before payment completed."))
            },
          },
        })

        razorpay.open()
      })
    } catch (paymentError) {
      const paymentErrorMessage =
        paymentError instanceof Error
          ? paymentError.message
          : "Failed to complete the Razorpay payment."
      const dismissed =
        paymentErrorMessage === "Razorpay checkout was closed before payment completed."

      setPaymentFailureKind(dismissed ? "dismissed" : "failed")
      setError(paymentErrorMessage)
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  if (completedCheckout) {
    const successHref = customerAuth.isAuthenticated
      ? storefrontPaths.accountOrder(completedCheckout.orderId)
      : storefrontPaths.trackOrder({
          orderNumber: completedCheckout.orderNumber,
          email: completedCheckout.shippingEmail,
        })

    const successState = (
      <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 pt-10 pb-14 sm:px-6 lg:px-8">
        <Card className="overflow-hidden rounded-[2.3rem] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(220,252,231,0.98)_52%,rgba(209,250,229,0.94))] py-0 shadow-[0_28px_70px_-40px_rgba(22,101,52,0.25)]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Checkout complete
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
                Order confirmed 🎉
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-emerald-900/80">
                {completedCheckout.summary}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-emerald-300/70 bg-white/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Order reference
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-emerald-950">
                  {completedCheckout.orderNumber}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-emerald-300/70 bg-white/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Status
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-emerald-950">
                  Paid and confirmed ✅
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-300/70 bg-white/55 p-4 text-sm leading-7 text-emerald-900/80">
              We are keeping you on this screen so you can review the confirmation first. Open the order page when you are ready.
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800"
              >
                <Link to={successHref}>
                  Open order page
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-emerald-300 bg-white/70 px-5 text-emerald-900 hover:bg-white"
              >
                <Link to={resolvedCartHref}>Back to cart</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )

    if (embedded) {
      return successState
    }

    return <StorefrontLayout showCategoryMenu={false}>{successState}</StorefrontLayout>
  }

  if (cart.items.length === 0) {
    const emptyState = (
      <div className="mx-auto grid w-full max-w-[96rem] gap-6 px-4 pt-8 pb-12 sm:px-6 lg:px-8 2xl:px-10">
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
                <Link to={resolvedCartHref}>
                  Return to cart
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
    )

    if (embedded) {
      return emptyState
    }

    return <StorefrontLayout showCategoryMenu={false}>{emptyState}</StorefrontLayout>
  }

  const checkoutContent = (
    <>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(225,203,178,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.78),transparent_28%),linear-gradient(180deg,rgba(249,245,239,0.72),transparent_70%)]" />
        <div className="mx-auto grid w-full max-w-[96rem] gap-6 px-4 pt-8 pb-14 sm:px-6 lg:px-8 2xl:px-10">
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
              <AlertDescription className="space-y-3">
                <p>{error}</p>
                {canRetryPayment && retryablePaymentSession ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-red-300 bg-white/90 text-red-900 hover:border-red-400 hover:bg-white"
                      onClick={() => void handleOpenRazorpayCheckout(retryablePaymentSession)}
                    >
                      {paymentFailureKind === "dismissed"
                        ? "Reopen payment"
                        : "Retry payment"}
                    </Button>
                    <span className="text-xs text-red-900/80">
                      {paymentFailureKind === "dismissed"
                        ? "Your pending order is still open. Reopen the same Razorpay checkout to continue."
                        : "Your pending order is still open. Retry the same Razorpay checkout instead of creating a new order."}
                    </span>
                  </div>
                ) : null}
              </AlertDescription>
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
                      onClick={() => openAddressDialog()}
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
                                  {address.city}
                                  {address.district ? `, ${address.district}` : ""}
                                  , {address.state}, {address.country}{" "}
                                  {address.pincode}
                                </p>
                                {incomplete ? (
                                  <div className="flex flex-wrap items-center gap-3">
                                    <p className="text-[#8c6a2f]">
                                      Complete this saved address or add a new one before paying.
                                    </p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 rounded-full border-[#e0c9ab] bg-[#fff8ec] px-3 text-[#8c6a2f] hover:border-[#d7ba91] hover:bg-[#fff3df]"
                                      onClick={(event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        openAddressDialog(address)
                                      }}
                                    >
                                      Edit address
                                    </Button>
                                  </div>
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
                    {availableDeliveryPreferences.map((option) => (
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
                  {isStorePickup && storefrontSettings.pickupLocation.enabled ? (
                    <div className="rounded-[1.45rem] border border-[#d7c4b1] bg-[#fffaf4] p-4 text-sm text-[#4b3527]">
                      <p className="font-semibold text-foreground">
                        {storefrontSettings.pickupLocation.storeName}
                      </p>
                      <p className="mt-1 leading-6">
                        {storefrontSettings.pickupLocation.line1}
                        {storefrontSettings.pickupLocation.line2
                          ? `, ${storefrontSettings.pickupLocation.line2}`
                          : ""}
                        <br />
                        {storefrontSettings.pickupLocation.city}, {storefrontSettings.pickupLocation.state}{" "}
                        {storefrontSettings.pickupLocation.pincode}
                        <br />
                        {storefrontSettings.pickupLocation.country}
                      </p>
                      <p className="mt-2 text-[#6b5a4c]">
                        {storefrontSettings.pickupLocation.pickupNote}
                      </p>
                    </div>
                  ) : null}
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
                    {availablePaymentOptions.map((option) => (
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
                      isConfirmingPayment ||
                      isLoadingLookups ||
                      !selectedAddress ||
                      !selectedAddressIsComplete ||
                      !isValidEmail(contactEmail)
                    }
                    onClick={() => void handlePlaceOrder()}
                  >
                    {isSubmitting
                      ? "Preparing order..."
                      : isConfirmingPayment
                        ? canRetryPayment
                          ? "Reopening Razorpay..."
                          : "Opening Razorpay..."
                        : canRetryPayment
                          ? "Retry payment"
                        : isStorePickup && selectedPaymentMethod === "pay-at-store"
                          ? "Reserve pickup"
                          : "Continue to pay"}
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
                          {selectedDeliveryOption.label} stays attached to this checkout so
                          the order can carry the delivery preference into fulfillment.
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

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="w-[min(94vw,58rem)] gap-5 rounded-[2rem] border-[#e2d4c5] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(252,248,243,0.96))] p-0 shadow-[0_36px_90px_-52px_rgba(48,31,19,0.28)]">
          <DialogHeader className="border-b border-[#efe4d8] px-6 pt-6 pb-5">
            <DialogTitle className="text-[1.75rem] tracking-tight">
              {editingAddressKey ? "Edit delivery address" : "Add delivery address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddressKey
                ? "Update the missing address details and save the completed delivery address."
                : "Save a complete delivery address once and reuse it for future orders."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 pb-6">
            {addressDialogError ? (
              <div className="flex items-start gap-3 rounded-[1.25rem] border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-950">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{addressDialogError}</span>
              </div>
            ) : null}
            {addressDialogErrorMessages.length > 0 ? (
              <div className="rounded-[1.25rem] border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-950">
                <p className="font-medium">Missing fields</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {addressDialogErrorMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="delivery-address-label"
                  className={addressDialogFieldErrors.label ? "text-destructive" : undefined}
                >
                  Address label
                </Label>
                <Input
                  id="delivery-address-label"
                  value={addressDialogState.label}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(addressDialogFieldErrors.label)}
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
                {addressDialogFieldErrors.label ? (
                  <p className="text-xs text-destructive">{addressDialogFieldErrors.label}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="delivery-address-phone"
                  className={addressDialogFieldErrors.phoneNumber ? "text-destructive" : undefined}
                >
                  Phone
                </Label>
                <Input
                  id="delivery-address-phone"
                  value={addressDialogState.phoneNumber}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      phoneNumber: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(addressDialogFieldErrors.phoneNumber)}
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
                {addressDialogFieldErrors.phoneNumber ? (
                  <p className="text-xs text-destructive">
                    {addressDialogFieldErrors.phoneNumber}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="delivery-address-first-name"
                  className={addressDialogFieldErrors.firstName ? "text-destructive" : undefined}
                >
                  First name
                </Label>
                <Input
                  id="delivery-address-first-name"
                  value={addressDialogState.firstName}
                  onChange={(event) =>
                    updateAddressDialogState((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(addressDialogFieldErrors.firstName)}
                  className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                />
                {addressDialogFieldErrors.firstName ? (
                  <p className="text-xs text-destructive">{addressDialogFieldErrors.firstName}</p>
                ) : null}
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
                <Label
                  htmlFor="delivery-address-line1"
                  className={addressDialogFieldErrors.line1 ? "text-destructive" : undefined}
                >
                  Address line 1
                </Label>
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
                  aria-invalid={Boolean(addressDialogFieldErrors.line1)}
                  className="rounded-xl border-[#e1d4c6] bg-white"
                />
                {addressDialogFieldErrors.line1 ? (
                  <p className="text-xs text-destructive">{addressDialogFieldErrors.line1}</p>
                ) : null}
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
                    <Label className={addressDialogFieldErrors.countryId ? "text-destructive" : undefined}>
                      Country
                    </Label>
                    <SearchableLookupField
                      value={addressDialogState.countryId}
                      onValueChange={(value) => {
                        const nextCountry = lookupState.countries.find((item) => item.id === value)
                        updateAddressDialogState((current) => ({
                          ...current,
                          countryId: value,
                          country: nextCountry
                            ? getCommonModuleLabel(nextCountry, "countries")
                            : current.country,
                          stateId: "1",
                          districtId: "1",
                          cityId: "1",
                          pincodeId: "1",
                          state: "",
                          district: "",
                          city: "",
                          pincode: "",
                        }))
                      }}
                      options={lookupState.countries.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "countries"),
                      }))}
                      placeholder="Search country"
                      searchPlaceholder="Search country"
                      noResultsMessage="No country found."
                      error={addressDialogFieldErrors.countryId}
                      createActionLabel='Create new "Country"'
                      onCreateNew={
                        customerAuth.isAuthenticated
                          ? undefined
                          : (query) => createGuestAddressLookup("countries", query)
                      }
                    />
                    {addressDialogFieldErrors.countryId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.countryId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label className={addressDialogFieldErrors.stateId ? "text-destructive" : undefined}>
                      State
                    </Label>
                    <SearchableLookupField
                      value={addressDialogState.stateId}
                      onValueChange={(value) => {
                        const nextState = filteredStateOptions.find((item) => item.id === value)
                        updateAddressDialogState((current) => ({
                          ...current,
                          stateId: value,
                          state: nextState ? getCommonModuleLabel(nextState, "states") : current.state,
                          districtId: "1",
                          cityId: "1",
                          pincodeId: "1",
                          district: "",
                          city: "",
                          pincode: "",
                        }))
                      }}
                      options={filteredStateOptions.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "states"),
                      }))}
                      placeholder="Search state"
                      searchPlaceholder="Search state"
                      noResultsMessage="No state found."
                      error={addressDialogFieldErrors.stateId}
                      createActionLabel='Create new "State"'
                      onCreateNew={
                        customerAuth.isAuthenticated
                          ? undefined
                          : (query) => createGuestAddressLookup("states", query)
                      }
                    />
                    {addressDialogFieldErrors.stateId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.stateId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label className={addressDialogFieldErrors.districtId ? "text-destructive" : undefined}>
                      District
                    </Label>
                    <SearchableLookupField
                      value={addressDialogState.districtId}
                      onValueChange={(value) => {
                        const nextDistrict = filteredDistrictOptions.find((item) => item.id === value)
                        updateAddressDialogState((current) => ({
                          ...current,
                          districtId: value,
                          district: nextDistrict
                            ? getCommonModuleLabel(nextDistrict, "districts")
                            : current.district,
                          cityId: "1",
                          pincodeId: "1",
                          city: "",
                          pincode: "",
                        }))
                      }}
                      options={filteredDistrictOptions.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "districts"),
                      }))}
                      placeholder="Search district"
                      searchPlaceholder="Search district"
                      noResultsMessage="No district found."
                      error={addressDialogFieldErrors.districtId}
                      createActionLabel='Create new "District"'
                      onCreateNew={
                        customerAuth.isAuthenticated
                          ? undefined
                          : (query) => createGuestAddressLookup("districts", query)
                      }
                    />
                    {addressDialogFieldErrors.districtId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.districtId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label className={addressDialogFieldErrors.cityId ? "text-destructive" : undefined}>
                      City
                    </Label>
                    <SearchableLookupField
                      value={addressDialogState.cityId}
                      onValueChange={(value) => {
                        const nextCity = filteredCityOptions.find((item) => item.id === value)
                        updateAddressDialogState((current) => ({
                          ...current,
                          cityId: value,
                          city: nextCity ? getCommonModuleLabel(nextCity, "cities") : current.city,
                          districtId:
                            getCommonModuleValue(nextCity ?? ({} as CommonModuleItem), "district_id") ||
                            current.districtId,
                          pincodeId: "1",
                          pincode: "",
                        }))
                      }}
                      options={filteredCityOptions.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "cities"),
                      }))}
                      placeholder="Search city"
                      searchPlaceholder="Search city"
                      noResultsMessage="No city found."
                      error={addressDialogFieldErrors.cityId}
                      createActionLabel='Create new "City"'
                      onCreateNew={
                        customerAuth.isAuthenticated
                          ? undefined
                          : (query) => createGuestAddressLookup("cities", query)
                      }
                    />
                    {addressDialogFieldErrors.cityId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.cityId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label className={addressDialogFieldErrors.pincodeId ? "text-destructive" : undefined}>
                      Postal code
                    </Label>
                    <SearchableLookupField
                      value={addressDialogState.pincodeId}
                      onValueChange={(value) => {
                        const nextPincode = filteredPincodeOptions.find((item) => item.id === value)
                        updateAddressDialogState((current) => ({
                          ...current,
                          pincodeId: value,
                          pincode: nextPincode
                            ? getCommonModuleLabel(nextPincode, "pincodes")
                            : current.pincode,
                          cityId:
                            getCommonModuleValue(nextPincode ?? ({} as CommonModuleItem), "city_id") ||
                            current.cityId,
                          districtId:
                            getCommonModuleValue(nextPincode ?? ({} as CommonModuleItem), "district_id") ||
                            current.districtId,
                          stateId:
                            getCommonModuleValue(nextPincode ?? ({} as CommonModuleItem), "state_id") ||
                            current.stateId,
                          countryId:
                            getCommonModuleValue(nextPincode ?? ({} as CommonModuleItem), "country_id") ||
                            current.countryId,
                        }))
                      }}
                      options={filteredPincodeOptions.map((item) => ({
                        value: item.id,
                        label: getCommonModuleLabel(item, "pincodes"),
                      }))}
                      placeholder="Search postal code"
                      searchPlaceholder="Search postal code"
                      noResultsMessage="No postal code found."
                      error={addressDialogFieldErrors.pincodeId}
                      createActionLabel='Create new "Postal code"'
                      onCreateNew={
                        customerAuth.isAuthenticated
                          ? undefined
                          : (query) => createGuestAddressLookup("pincodes", query)
                      }
                    />
                    {addressDialogFieldErrors.pincodeId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.pincodeId}</p>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-address-country"
                      className={addressDialogFieldErrors.countryId ? "text-destructive" : undefined}
                    >
                      Country
                    </Label>
                    <Input
                      id="delivery-address-country"
                      value={addressDialogState.country}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          country: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(addressDialogFieldErrors.countryId)}
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                    {addressDialogFieldErrors.countryId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.countryId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-address-state"
                      className={addressDialogFieldErrors.stateId ? "text-destructive" : undefined}
                    >
                      State
                    </Label>
                    <Input
                      id="delivery-address-state"
                      value={addressDialogState.state}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          state: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(addressDialogFieldErrors.stateId)}
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                    {addressDialogFieldErrors.stateId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.stateId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-address-district"
                      className={addressDialogFieldErrors.districtId ? "text-destructive" : undefined}
                    >
                      District
                    </Label>
                    <Input
                      id="delivery-address-district"
                      value={addressDialogState.district}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          district: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(addressDialogFieldErrors.districtId)}
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                    {addressDialogFieldErrors.districtId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.districtId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-address-city"
                      className={addressDialogFieldErrors.cityId ? "text-destructive" : undefined}
                    >
                      City
                    </Label>
                    <Input
                      id="delivery-address-city"
                      value={addressDialogState.city}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(addressDialogFieldErrors.cityId)}
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                    {addressDialogFieldErrors.cityId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.cityId}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="delivery-address-pincode"
                      className={addressDialogFieldErrors.pincodeId ? "text-destructive" : undefined}
                    >
                      Postal code
                    </Label>
                    <Input
                      id="delivery-address-pincode"
                      value={addressDialogState.pincode}
                      onChange={(event) =>
                        updateAddressDialogState((current) => ({
                          ...current,
                          pincode: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(addressDialogFieldErrors.pincodeId)}
                      className="h-12 rounded-xl border-[#e1d4c6] bg-white"
                    />
                    {addressDialogFieldErrors.pincodeId ? (
                      <p className="text-xs text-destructive">{addressDialogFieldErrors.pincodeId}</p>
                    ) : null}
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
                Loading country, state, district, city, and postal lookups.
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
                {isSavingAddress
                  ? "Saving..."
                  : editingAddressKey
                    ? "Update address"
                    : "Save address"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )

  if (embedded) {
    return checkoutContent
  }

  return <StorefrontLayout showCategoryMenu={false}>{checkoutContent}</StorefrontLayout>
}
