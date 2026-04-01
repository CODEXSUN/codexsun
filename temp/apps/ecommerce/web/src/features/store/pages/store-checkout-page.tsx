import { useEffect, useMemo, useState } from "react"
import type { CommonModuleItem } from "@shared/index"
import { CheckCircle2Icon, CreditCardIcon, LoaderCircleIcon, MapPinIcon, PlusIcon, Trash2Icon, TruckIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { AutocompleteLookup } from "@/components/lookups/AutocompleteLookup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@framework-core/web/auth/components/auth-provider"
import {
  createEmptyAddress,
  getDefaultCustomerAddress,
  readCustomerProfile,
  type CustomerAddress,
  writeCustomerProfile,
} from "@/features/customer-portal/lib/customer-profile-storage"
import { useStorefront } from "@/features/store/context/storefront-context"
import { formatCurrency, getPrimaryProductImage } from "@/features/store/lib/storefront-utils"
import type {
  StorefrontDeliveryMethod,
  StorefrontOrder,
  StorefrontPaymentMethod,
  StorefrontRazorpayCheckoutSession,
} from "@/features/store/types/storefront"
import {
  createStorefrontCheckout,
  getCustomerProfile,
  HttpError,
  listCommonModuleItems,
  updateCustomerProfile,
  verifyStorefrontPayment,
} from "@/shared/api/client"
import { createCommonLookupOption, toLookupOption } from "@/shared/forms/common-lookup"
import { showFailedActionToast, showSuccessToast, showWarningToast } from "@/shared/notifications/toast"

type CheckoutFormValues = {
  firstName: string
  lastName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  cityId: string
  city: string
  stateId: string
  state: string
  countryId: string
  country: string
  postalCodeId: string
  postalCode: string
  note: string
  deliveryMethod: StorefrontDeliveryMethod
  paymentMethod: StorefrontPaymentMethod
}

type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayFailureResponse = {
  error?: {
    description?: string
  }
}

type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  image?: string
  order_id: string
  method?: "upi" | "card" | "wallet" | "netbanking" | "cod"
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  readonly?: {
    name?: boolean
    email?: boolean
    contact?: boolean
  }
  hidden?: {
    email?: boolean
    contact?: boolean
  }
  config?: {
    display: {
      blocks: Record<
        string,
        {
          name: string
          instruments: Array<{ method: "upi" | "wallet" | "card" }>
        }
      >
      sequence: string[]
      preferences: {
        show_default_blocks: boolean
      }
    }
  }
  theme?: {
    color?: string
  }
  modal?: {
    confirm_close?: boolean
    ondismiss?: () => void
  }
  handler: (response: RazorpaySuccessResponse) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void
      on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void
    }
  }
}

let razorpayScriptPromise: Promise<void> | null = null

function normalizeRazorpayContact(phone: string, country: string) {
  const trimmed = phone.trim()
  if (!trimmed) {
    return undefined
  }

  const digits = trimmed.replace(/\D/g, "")
  if (!digits) {
    return undefined
  }

  if (trimmed.startsWith("+")) {
    return `+${digits}`
  }

  if (digits.length === 10) {
    return `+91${digits}`
  }

  if (country.trim().toLowerCase() === "india" && digits.length < 12) {
    return `+91${digits}`
  }

  return `+${digits}`
}

function getRazorpayDisplayConfig(paymentMethod: StorefrontPaymentMethod): RazorpayCheckoutOptions["config"] | undefined {
  if (paymentMethod === "cod") {
    return undefined
  }

  if (paymentMethod === "card") {
    return {
      display: {
        blocks: {
          cards_only: {
            name: "Pay via card",
            instruments: [{ method: "card" }],
          },
        },
        sequence: ["block.cards_only"],
        preferences: {
          show_default_blocks: false,
        },
      },
    }
  }

  return {
    display: {
      blocks: {
        instant_payments: {
          name: "Pay via UPI or wallet",
          instruments: [{ method: "upi" }, { method: "wallet" }],
        },
      },
      sequence: ["block.instant_payments"],
      preferences: {
        show_default_blocks: false,
      },
    },
  }
}

function loadRazorpayCheckoutScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout can only load in the browser."))
  }

  if (window.Razorpay) {
    return Promise.resolve()
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise
  }

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Razorpay Checkout.")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout."))
    document.body.appendChild(script)
  }).catch((error) => {
    razorpayScriptPromise = null
    throw error
  })

  return razorpayScriptPromise
}

async function openRazorpayCheckout(
  session: StorefrontRazorpayCheckoutSession,
  values: CheckoutFormValues,
  storefrontOrderId: string,
) {
  await loadRazorpayCheckoutScript()

  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout is unavailable in this browser session.")
  }

  return new Promise<StorefrontOrder>((resolve, reject) => {
    const Razorpay = window.Razorpay
    if (!Razorpay) {
      reject(new Error("Razorpay Checkout is unavailable in this browser session."))
      return
    }
    const prefillContact = normalizeRazorpayContact(session.prefillContact ?? values.phone, values.country)
    const razorpay = new Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: session.name,
      description: session.description ?? undefined,
      image: session.image ?? undefined,
      order_id: session.orderId,
      method: values.paymentMethod === "card" ? "card" : values.paymentMethod === "upi" ? "upi" : undefined,
      prefill: {
        name: session.prefillName ?? undefined,
        email: session.prefillEmail ?? undefined,
        contact: prefillContact ?? session.prefillContact ?? undefined,
      },
      readonly: {
        name: true,
        email: true,
        contact: true,
      },
      hidden: {
        email: false,
        contact: false,
      },
      config: getRazorpayDisplayConfig(values.paymentMethod),
      theme: session.themeColor ? { color: session.themeColor } : undefined,
      modal: {
        confirm_close: true,
        ondismiss: () => reject(new Error("Payment cancelled before completion.")),
      },
      handler: (response) => {
        void (async () => {
          try {
            const order = await verifyStorefrontPayment({
              storefrontOrderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            resolve(order)
          } catch (error) {
            reject(error instanceof Error ? error : new Error('Payment verification failed.'))
          }
        })()
      },
    })

    razorpay.on("payment.failed", (response) => {
      reject(new Error(response.error?.description ?? "Razorpay payment failed."))
    })

    razorpay.open()
  })
}

const defaultFormValues: CheckoutFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  cityId: "",
  city: "",
  stateId: "",
  state: "",
  countryId: "",
  country: "",
  postalCodeId: "",
  postalCode: "",
  note: "",
  deliveryMethod: "standard",
  paymentMethod: "upi",
}

function resolveLookupLabel(items: CommonModuleItem[], value: string) {
  const match = items.find((item) => String(item.id) === value)
  return match ? toLookupOption(match).label : value
}

function CheckoutLookupField({
  label,
  value,
  options,
  placeholder,
  moduleKey,
  onChange,
  onItemsChange,
}: {
  label: string
  value: string
  options: CommonModuleItem[]
  placeholder: string
  moduleKey: "countries" | "states" | "cities" | "pincodes"
  onChange: (value: string) => void
  onItemsChange: (items: CommonModuleItem[]) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <AutocompleteLookup
        value={value}
        onChange={onChange}
        options={options.map(toLookupOption)}
        allowEmptyOption
        emptyOptionLabel="-"
        placeholder={placeholder}
        createOption={async (labelValue) => {
          const { item, option } = await createCommonLookupOption(moduleKey, labelValue)
          onItemsChange([...options, item])
          return option
        }}
      />
    </div>
  )
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: "", lastName: "" }
  }

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  }
}

const deliveryOptions: Array<{ value: StorefrontDeliveryMethod; label: string; detail: string }> = [
  { value: "standard", label: "Standard delivery", detail: "3-5 business days. Free over INR 5,000." },
  { value: "priority", label: "Priority delivery", detail: "1-2 business days. INR 299." },
  { value: "signature", label: "Signature packaging", detail: "Occasion-ready packaging with premium handoff." },
]

const paymentOptions: Array<{ value: StorefrontPaymentMethod; label: string; detail: string; disabled?: boolean }> = [
  { value: "upi", label: "UPI / Wallet", detail: "Opens Razorpay Checkout with UPI and wallet payment methods." },
  { value: "card", label: "Credit or debit card", detail: "Opens Razorpay Checkout and completes payment before confirmation." },
  { value: "cod", label: "Cash on delivery", detail: "Show this option to clients while checkout stays on Razorpay.", disabled: true },
]

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    if (
      error.context &&
      typeof error.context === "object" &&
      "detail" in error.context &&
      typeof error.context.detail === "string" &&
      error.context.detail.trim().length > 0
    ) {
      return error.context.detail
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Failed to place storefront order."
}

function isBlank(value: string) {
  return value.trim().length === 0
}

function getPaymentSummaryLabel(order: StorefrontOrder) {
  if (order.paymentGateway === "razorpay") {
    return "Razorpay"
  }

  if (order.paymentGateway === "test_bypass") {
    return "Razorpay"
  }

  return "Order payment"
}

function hasUsableAddress(address: CustomerAddress) {
  return !isBlank(address.addressLine1) && !isBlank(address.cityId) && !isBlank(address.stateId) && !isBlank(address.countryId) && !isBlank(address.postalCodeId)
}

function normalizeAddressCollection(addresses: CustomerAddress[]) {
  if (addresses.length === 0) {
    return []
  }

  let hasDefault = false

  return addresses.map((address, index) => {
    const normalized = {
      ...address,
      isDefault: address.isDefault && !hasDefault,
      label: address.label.trim() || `Address ${index + 1}`,
    }

    if (normalized.isDefault) {
      hasDefault = true
    }

    if (!hasDefault && index === 0) {
      hasDefault = true
      return {
        ...normalized,
        isDefault: true,
      }
    }

    return normalized
  })
}

export function StoreCheckoutPage() {
  const auth = useAuth()
  const { cartItems, products, cartSubtotal, clearCart } = useStorefront()
  const [values, setValues] = useState<CheckoutFormValues>(defaultFormValues)
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([])
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string | null>(null)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [addressSaving, setAddressSaving] = useState(false)
  const [addressDialogError, setAddressDialogError] = useState<string | null>(null)
  const [draftAddress, setDraftAddress] = useState<CustomerAddress>(() => createEmptyAddress())
  const [countries, setCountries] = useState<CommonModuleItem[]>([])
  const [states, setStates] = useState<CommonModuleItem[]>([])
  const [cities, setCities] = useState<CommonModuleItem[]>([])
  const [pincodes, setPincodes] = useState<CommonModuleItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<StorefrontOrder | null>(null)

  const shipping = cartSubtotal > 5000 ? 0 : 199
  const handling = cartItems.length > 0 ? 99 : 0
  const total = cartSubtotal + shipping + handling
  const orderItems = useMemo(
    () =>
      cartItems
        .map((item) => ({ item, product: products.find((entry) => entry.id === item.productId) }))
        .filter((entry): entry is { item: typeof cartItems[number]; product: typeof products[number] } => Boolean(entry.product)),
    [cartItems, products],
  )

  const canSubmit = cartItems.length > 0 && !submitting
  const isOnlinePayment = values.paymentMethod !== "cod"

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      const [countryItems, stateItems, cityItems, pincodeItems] = await Promise.all([
        listCommonModuleItems("countries", false),
        listCommonModuleItems("states", false),
        listCommonModuleItems("cities", false),
        listCommonModuleItems("pincodes", false),
      ])

      if (cancelled) {
        return
      }

      setCountries(countryItems)
      setStates(stateItems)
      setCities(cityItems)
      setPincodes(pincodeItems)
    }

    void loadLookups()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadCustomerAddresses() {
      const user = auth.session?.user
      const token = auth.session?.accessToken
      const { firstName, lastName } = splitDisplayName(user?.displayName ?? "")

      if (token && user?.actorType === "customer") {
        try {
          const profile = await getCustomerProfile(token)
          if (cancelled) {
            return
          }

          const availableAddresses = profile.addresses.filter(hasUsableAddress)
          const defaultAddress = getDefaultCustomerAddress({
            email: profile.email,
            addresses: availableAddresses,
          })

          setSavedAddresses(availableAddresses)
          setSelectedDeliveryAddressId(availableAddresses.length > 0 ? defaultAddress.id : null)
          setValues((current) => ({
            ...current,
            firstName: defaultAddress.firstName || firstName || current.firstName,
            lastName: defaultAddress.lastName || lastName || current.lastName,
            email: profile.email || user?.email || current.email,
            phone: defaultAddress.phone || profile.phoneNumber || user?.phoneNumber || current.phone,
            addressLine1: availableAddresses.length > 0 ? defaultAddress.addressLine1 : "",
            addressLine2: availableAddresses.length > 0 ? defaultAddress.addressLine2 : "",
            cityId: availableAddresses.length > 0 ? defaultAddress.cityId : "",
            city: availableAddresses.length > 0 ? defaultAddress.city : "",
            stateId: availableAddresses.length > 0 ? defaultAddress.stateId : "",
            state: availableAddresses.length > 0 ? defaultAddress.state : "",
            countryId: availableAddresses.length > 0 ? defaultAddress.countryId : "",
            country: availableAddresses.length > 0 ? defaultAddress.country : "",
            postalCodeId: availableAddresses.length > 0 ? defaultAddress.postalCodeId : "",
            postalCode: availableAddresses.length > 0 ? defaultAddress.postalCode : "",
          }))
          return
        } catch {
          // Fall back to local profile if the customer profile endpoint is not ready yet.
        }
      }

      const savedProfile = readCustomerProfile()
      const availableAddresses = savedProfile.addresses.filter(hasUsableAddress)
      const defaultAddress = getDefaultCustomerAddress({
        email: savedProfile.email,
        addresses: availableAddresses,
      })

      if (cancelled) {
        return
      }

      setSavedAddresses(availableAddresses)
      setSelectedDeliveryAddressId(availableAddresses.length > 0 ? defaultAddress.id : null)
      setValues((current) => ({
        ...current,
        firstName: defaultAddress.firstName || (current.firstName === defaultFormValues.firstName ? firstName || current.firstName : current.firstName),
        lastName: defaultAddress.lastName || (current.lastName === defaultFormValues.lastName ? (lastName || current.lastName) : current.lastName),
        email: savedProfile.email || (current.email === defaultFormValues.email ? user?.email ?? current.email : current.email),
        phone: defaultAddress.phone || (current.phone === defaultFormValues.phone ? user?.phoneNumber ?? current.phone : current.phone),
        addressLine1: availableAddresses.length > 0 ? defaultAddress.addressLine1 : "",
        addressLine2: availableAddresses.length > 0 ? defaultAddress.addressLine2 : "",
        cityId: availableAddresses.length > 0 ? defaultAddress.cityId : "",
        city: availableAddresses.length > 0 ? defaultAddress.city : "",
        stateId: availableAddresses.length > 0 ? defaultAddress.stateId : "",
        state: availableAddresses.length > 0 ? defaultAddress.state : "",
        countryId: availableAddresses.length > 0 ? defaultAddress.countryId : "",
        country: availableAddresses.length > 0 ? defaultAddress.country : "",
        postalCodeId: availableAddresses.length > 0 ? defaultAddress.postalCodeId : "",
        postalCode: availableAddresses.length > 0 ? defaultAddress.postalCode : "",
      }))
    }

    void loadCustomerAddresses()

    return () => {
      cancelled = true
    }
  }, [auth.session?.accessToken, auth.session?.user])

  function applySavedAddress(address: CustomerAddress) {
    setSelectedDeliveryAddressId(address.id)
    setValues((current) => ({
      ...current,
      firstName: address.firstName || current.firstName,
      lastName: address.lastName || current.lastName,
      phone: address.phone || current.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      cityId: address.cityId,
      city: address.city,
      stateId: address.stateId,
      state: address.state,
      countryId: address.countryId,
      country: address.country,
      postalCodeId: address.postalCodeId,
      postalCode: address.postalCode,
    }))
  }

  function openAddressDialog() {
    setAddressDialogError(null)
    setDraftAddress({
      ...createEmptyAddress(),
      label: savedAddresses.length === 0 ? "Home" : `Address ${savedAddresses.length + 1}`,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      countryId: values.countryId,
      country: values.country,
      stateId: values.stateId,
      state: values.state,
      cityId: values.cityId,
      city: values.city,
      postalCodeId: values.postalCodeId,
      postalCode: values.postalCode,
      isDefault: savedAddresses.length === 0,
    })
    setAddressDialogOpen(true)
  }

  async function persistAddressCollection(nextAddresses: CustomerAddress[], preferredAddressId?: string | null) {
    const token = auth.session?.accessToken
    const sessionUser = auth.session?.user
    const normalizedAddresses = normalizeAddressCollection(nextAddresses)

    setAddressSaving(true)
    setAddressDialogError(null)

    try {
      if (token && sessionUser?.actorType === "customer") {
        const activeAddress = normalizedAddresses.find((address) => address.id === preferredAddressId) ?? normalizedAddresses.find((address) => address.isDefault) ?? normalizedAddresses[0] ?? null
        const savedProfile = await updateCustomerProfile(token, {
          displayName: activeAddress ? `${activeAddress.firstName} ${activeAddress.lastName}`.trim() || sessionUser.displayName : sessionUser.displayName,
          phoneNumber: activeAddress?.phone || sessionUser.phoneNumber,
          addresses: normalizedAddresses,
        })

        const availableAddresses = savedProfile.addresses.filter(hasUsableAddress)
        setSavedAddresses(availableAddresses)
        const selectedAddress = availableAddresses.find((address) => address.id === preferredAddressId)
          ?? availableAddresses.find((address) => address.isDefault)
          ?? availableAddresses[0]
          ?? null

        if (selectedAddress) {
          applySavedAddress(selectedAddress)
        } else {
          setSelectedDeliveryAddressId(null)
          setValues((current) => ({
            ...current,
            addressLine1: "",
            addressLine2: "",
            cityId: "",
            city: "",
            stateId: "",
            state: "",
            countryId: "",
            country: "",
            postalCodeId: "",
            postalCode: "",
          }))
        }
        return availableAddresses
      }

      writeCustomerProfile({
        email: values.email,
        addresses: normalizedAddresses,
      })

      const availableAddresses = normalizedAddresses.filter(hasUsableAddress)
      setSavedAddresses(availableAddresses)
      const selectedAddress = availableAddresses.find((address) => address.id === preferredAddressId)
        ?? availableAddresses.find((address) => address.isDefault)
        ?? availableAddresses[0]
        ?? null

      if (selectedAddress) {
        applySavedAddress(selectedAddress)
      } else {
        setSelectedDeliveryAddressId(null)
        setValues((current) => ({
          ...current,
          addressLine1: "",
          addressLine2: "",
          cityId: "",
          city: "",
          stateId: "",
          state: "",
          countryId: "",
          country: "",
          postalCodeId: "",
          postalCode: "",
        }))
      }

      return availableAddresses
    } catch (error) {
      const message = toErrorMessage(error)
      setAddressDialogError(message)
      showFailedActionToast({
        entityLabel: "address",
        action: "save",
        detail: message,
      })
      throw error
    } finally {
      setAddressSaving(false)
    }
  }

  async function handleSaveAddress() {
    if (
      isBlank(draftAddress.label)
      || isBlank(draftAddress.firstName)
      || isBlank(draftAddress.lastName)
      || isBlank(draftAddress.phone)
      || isBlank(draftAddress.addressLine1)
      || isBlank(draftAddress.countryId)
      || isBlank(draftAddress.stateId)
      || isBlank(draftAddress.cityId)
      || isBlank(draftAddress.postalCodeId)
    ) {
      setAddressDialogError("Complete all required address fields before saving.")
      return
    }

    const normalizedDraft = {
      ...draftAddress,
      label: draftAddress.label.trim(),
      firstName: draftAddress.firstName.trim(),
      lastName: draftAddress.lastName.trim(),
      phone: draftAddress.phone.trim(),
      addressLine1: draftAddress.addressLine1.trim(),
      addressLine2: draftAddress.addressLine2.trim(),
    }

    const nextAddresses = [
      ...savedAddresses.map((address) => ({
        ...address,
        isDefault: normalizedDraft.isDefault ? false : address.isDefault,
      })),
      normalizedDraft,
    ]

    try {
      await persistAddressCollection(nextAddresses, normalizedDraft.id)
      setAddressDialogOpen(false)
      showSuccessToast({
        title: "Address saved",
        description: "Your delivery address is ready for checkout.",
      })
    } catch (error) {
      setAddressDialogError(toErrorMessage(error))
    } finally {
      // handled in persistAddressCollection
    }
  }

  const selectedAddress = savedAddresses.find((address) => address.id === selectedDeliveryAddressId) ?? null

  async function handleSetDefaultAddress(addressId: string) {
    const nextAddresses = savedAddresses.map((address) => ({
      ...address,
      isDefault: address.id === addressId,
    }))

    try {
      await persistAddressCollection(nextAddresses, addressId)
      showSuccessToast({
        title: "Default address updated",
        description: "This address will be selected first during checkout.",
      })
    } catch {
      // handled in persistAddressCollection
    }
  }

  async function handleRemoveAddress(addressId: string) {
    const nextAddresses = savedAddresses.filter((address) => address.id !== addressId)

    try {
      await persistAddressCollection(nextAddresses, selectedDeliveryAddressId === addressId ? null : selectedDeliveryAddressId)
      showSuccessToast({
        title: "Address removed",
        description: "The delivery address has been removed from your account.",
      })
    } catch {
      // handled in persistAddressCollection
    }
  }

  async function handleSubmit() {
    if (cartItems.length === 0) {
      showWarningToast({
        title: "Checkout not ready",
        description: "Add products to the cart before placing an order.",
      })
      return
    }

    if (!selectedAddress) {
      setErrorMessage("Add and select a delivery address before placing the order.")
      showWarningToast({
        title: "Delivery address required",
        description: "Add a delivery address to continue checkout.",
      })
      return
    }

    if (
      isBlank(values.firstName)
      || isBlank(values.lastName)
      || isBlank(values.email)
      || isBlank(values.phone)
      || isBlank(values.addressLine1)
      || isBlank(values.city)
      || isBlank(values.state)
      || isBlank(values.country)
      || isBlank(values.postalCode)
    ) {
      setErrorMessage("Complete the delivery address and contact fields before placing the order.")
      showWarningToast({
        title: "Checkout not submitted",
        description: "Complete the address and contact fields before placing the order.",
      })
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const checkout = await createStorefrontCheckout({
        ...values,
        addressLine2: values.addressLine2 || null,
        note: values.note || null,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
      })

      if (!checkout.requiresPayment || !checkout.paymentSession) {
        throw new Error("Online checkout did not return a Razorpay session.")
      }

      const order = await openRazorpayCheckout(checkout.paymentSession, values, checkout.order.id)

      setPlacedOrder(order)
      clearCart()
      showSuccessToast({
        title: "Payment received",
        description: `Storefront order ${order.orderNumber} is confirmed.`,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      if (message === "Payment cancelled before completion.") {
        showWarningToast({
          title: "Payment cancelled",
          description: "You can continue checkout whenever you are ready.",
        })
      } else {
        showFailedActionToast({
          entityLabel: isOnlinePayment ? "payment" : "order",
          action: isOnlinePayment ? "process" : "place",
          detail: message,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (cartItems.length === 0 && !placedOrder) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 pb-24 sm:px-6">
        <div className="rounded-[2rem] border border-dashed border-border/70 bg-white/75 p-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Your checkout is waiting for cart items.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Add products to the cart first so the checkout flow has an order to process.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/cart">Back to cart</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (placedOrder) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 pb-24 sm:px-6 sm:py-10">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#eef7ef_0%,#d9eddd_100%)] p-8 shadow-[0_24px_60px_-44px_rgba(32,85,44,0.22)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                <CheckCircle2Icon className="size-4" />
                {placedOrder.paymentGateway === "razorpay"
                  ? "Payment verified"
                    : "Order confirmed"}
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-emerald-950">Order {placedOrder.orderNumber} has been placed.</h2>
              <p className="max-w-2xl text-sm leading-6 text-emerald-900/80">
                {placedOrder.paymentGateway === "razorpay"
                  ? "Razorpay payment was verified on the backend and the cart has been cleared."
                    : "Cash-on-delivery checkout was stored in the backend order tables and the cart has been cleared."}
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link to="/search">Continue shopping</Link>
            </Button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPinIcon className="size-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold tracking-tight">Delivery address</h2>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{placedOrder.firstName} {placedOrder.lastName}</p>
              <p>{placedOrder.addressLine1}</p>
              {placedOrder.addressLine2 ? <p>{placedOrder.addressLine2}</p> : null}
              <p>{placedOrder.city}, {placedOrder.state} {placedOrder.postalCode}</p>
              <p>{placedOrder.country}</p>
              <p>{placedOrder.email}</p>
              <p>{placedOrder.phone}</p>
            </div>
          </section>

          <aside className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Order summary</h2>
            <div className="grid gap-4">
              {placedOrder.items.map((item) => (
                <div key={item.id} className="rounded-[1.4rem] border border-border/70 bg-background/70 p-3">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.size} / {item.color} / Qty {item.quantity}
                  </div>
                  <div className="mt-1 text-sm font-semibold">{formatCurrency(item.lineTotal)}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(placedOrder.subtotal)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Shipping</span><span>{placedOrder.shippingAmount === 0 ? "Free" : formatCurrency(placedOrder.shippingAmount)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Handling</span><span>{formatCurrency(placedOrder.handlingAmount)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Payment</span><span>{getPaymentSummaryLabel(placedOrder)}</span></div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>{formatCurrency(placedOrder.totalAmount)}</span></div>
            </div>
          </aside>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 pb-24 sm:px-6 sm:py-10">
      <section className="rounded-[2.2rem] border border-white/70 bg-white/78 p-6 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.25)] sm:p-8">
        <div className="space-y-3">
          <Badge variant="outline" className="w-fit">
            Checkout
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Secure factory-direct checkout.</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Review your Tirupur Direct shipment, choose a saved delivery address, and complete payment with a simple final confirmation.
          </p>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-[1.2rem] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPinIcon className="size-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold tracking-tight">Delivery address</h2>
            </div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Saved delivery addresses</p>
                <p className="text-sm text-muted-foreground">Select the address for this shipment or add a fresh delivery location.</p>
              </div>
              <Button type="button" variant="outline" onClick={openAddressDialog}>
                <PlusIcon className="size-4" />
                Add new address
              </Button>
            </div>
            {savedAddresses.length > 0 ? (
              <div className="grid gap-3">
                {savedAddresses.map((address) => (
                  <div
                    key={address.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-[1.2rem] border px-4 py-3 text-sm transition ${
                      selectedDeliveryAddressId === address.id
                        ? "border-primary bg-accent/35"
                        : "border-border bg-background/70 hover:bg-accent/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="saved-delivery-address"
                      checked={selectedDeliveryAddressId === address.id}
                      onChange={() => applySavedAddress(address)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            {address.label}
                            {address.isDefault ? <Badge variant="outline">Default</Badge> : null}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {address.isDefault ? (
                            <span className="text-xs font-medium text-muted-foreground">Primary</span>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 rounded-full px-2 text-xs"
                              onClick={() => { void handleSetDefaultAddress(address.id) }}
                              disabled={addressSaving}
                            >
                              Set default
                            </Button>
                          )}
                        </div>
                      </div>
                      <span className="mt-1 block text-muted-foreground">
                        {address.firstName} {address.lastName}, {address.addressLine1}
                      </span>
                      {address.addressLine2 ? (
                        <span className="block text-muted-foreground">{address.addressLine2}</span>
                      ) : null}
                      <span className="block text-muted-foreground">
                        {address.city}, {address.state} {address.postalCode}, {address.country}
                      </span>
                      <span className="block text-muted-foreground">{address.phone}</span>
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={() => { void handleRemoveAddress(address.id) }}
                          disabled={addressSaving || savedAddresses.length <= 1}
                        >
                          <Trash2Icon className="size-4" />
                          <span className="sr-only">Remove address</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-border/70 bg-background/70 px-4 py-5 text-sm text-muted-foreground">
                No delivery address has been saved yet. Add one to continue checkout.
              </div>
            )}
            <div className="mt-5 grid gap-4 rounded-[1.4rem] border border-border/70 bg-background/60 p-4">
              <div>
                <Label>Contact email</Label>
                <p className="mt-2 text-sm text-foreground">{values.email}</p>
              </div>
              {selectedAddress ? (
                <div className="grid gap-2 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Delivering to</p>
                  <p className="font-medium text-foreground">
                    {selectedAddress.firstName} {selectedAddress.lastName}
                  </p>
                  <p className="text-muted-foreground">{selectedAddress.addressLine1}</p>
                  {selectedAddress.addressLine2 ? <p className="text-muted-foreground">{selectedAddress.addressLine2}</p> : null}
                  <p className="text-muted-foreground">
                    {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">{selectedAddress.country}</p>
                  <p className="text-muted-foreground">{selectedAddress.phone}</p>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="checkout-note">Order note</Label>
                <Textarea id="checkout-note" value={values.note} rows={3} onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TruckIcon className="size-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold tracking-tight">Delivery preference</h2>
            </div>
            <div className="grid gap-3">
              {deliveryOptions.map((option) => (
                <label key={option.value} className="flex items-start gap-3 rounded-[1.4rem] border border-border bg-background/70 px-4 py-3 text-sm">
                  <input
                    type="radio"
                    name="delivery"
                    checked={values.deliveryMethod === option.value}
                    onChange={() => setValues((current) => ({ ...current, deliveryMethod: option.value }))}
                  />
                  <span>
                    <span className="block font-medium text-foreground">{option.label}</span>
                    <span className="text-muted-foreground">{option.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/70 bg-white/82 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CreditCardIcon className="size-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold tracking-tight">Payment method</h2>
            </div>
            <div className="grid gap-3">
              {paymentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 rounded-[1.4rem] border px-4 py-3 text-sm ${
                    option.disabled
                      ? "cursor-not-allowed border-border/60 bg-background/40 opacity-60"
                      : "border-border bg-background/70"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={values.paymentMethod === option.value}
                    disabled={option.disabled}
                    onChange={() => {
                      if (option.disabled) {
                        return
                      }

                      setValues((current) => ({ ...current, paymentMethod: option.value }))
                    }}
                  />
                  <span>
                    <span className="block font-medium text-foreground">
                      {option.label}
                      {option.disabled ? " (Coming soon)" : ""}
                    </span>
                    <span className="text-muted-foreground">{option.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[1.8rem] border border-white/70 bg-white/88 p-5 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.28)] backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Order summary</h2>
            <p className="mb-4 text-sm leading-6 text-muted-foreground">
              A quick view of the garments in this order, delivery charges, and the final payable total.
            </p>
            <div className="grid gap-4">
              {orderItems.map(({ item, product }) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 rounded-[1.4rem] border border-border/70 bg-background/70 p-3">
                  {getPrimaryProductImage(product) ? (
                    <img src={getPrimaryProductImage(product)} alt={product.name} className="size-20 rounded-2xl object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground">No image</div>
                  )}
                  <div className="space-y-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.size} / {item.color} / Qty {item.quantity}
                    </div>
                    <div className="text-sm font-semibold">{formatCurrency(product.price * item.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(cartSubtotal)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Handling</span><span>{formatCurrency(handling)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Payment</span><span>Razorpay Checkout</span></div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>

            <Button className="mt-5 w-full rounded-full" disabled={!canSubmit} onClick={() => { void handleSubmit() }}>
              {submitting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Preparing payment...
                </>
              ) : (
                "Continue to pay"
              )}
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add delivery address</DialogTitle>
            <DialogDescription>
              Save a complete Tirupur Direct delivery address once and reuse it for future orders.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {addressDialogError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {addressDialogError}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkout-address-label">Address label</Label>
                <Input id="checkout-address-label" value={draftAddress.label} onChange={(event) => setDraftAddress((current) => ({ ...current, label: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-address-phone">Phone</Label>
                <Input id="checkout-address-phone" value={draftAddress.phone} onChange={(event) => setDraftAddress((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-address-first-name">First name</Label>
                <Input id="checkout-address-first-name" value={draftAddress.firstName} onChange={(event) => setDraftAddress((current) => ({ ...current, firstName: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-address-last-name">Last name</Label>
                <Input id="checkout-address-last-name" value={draftAddress.lastName} onChange={(event) => setDraftAddress((current) => ({ ...current, lastName: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="checkout-address-line-1">Address line 1</Label>
                <Textarea id="checkout-address-line-1" value={draftAddress.addressLine1} rows={3} onChange={(event) => setDraftAddress((current) => ({ ...current, addressLine1: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="checkout-address-line-2">Address line 2</Label>
                <Input id="checkout-address-line-2" value={draftAddress.addressLine2} onChange={(event) => setDraftAddress((current) => ({ ...current, addressLine2: event.target.value }))} />
              </div>
              <CheckoutLookupField
                label="Country"
                value={draftAddress.countryId}
                options={countries}
                placeholder="Search country"
                moduleKey="countries"
                onItemsChange={setCountries}
                onChange={(value) => setDraftAddress((current) => ({
                  ...current,
                  countryId: value,
                  country: value ? resolveLookupLabel(countries, value) : "",
                }))}
              />
              <CheckoutLookupField
                label="State"
                value={draftAddress.stateId}
                options={states}
                placeholder="Search state"
                moduleKey="states"
                onItemsChange={setStates}
                onChange={(value) => setDraftAddress((current) => ({
                  ...current,
                  stateId: value,
                  state: value ? resolveLookupLabel(states, value) : "",
                }))}
              />
              <CheckoutLookupField
                label="City"
                value={draftAddress.cityId}
                options={cities}
                placeholder="Search city"
                moduleKey="cities"
                onItemsChange={setCities}
                onChange={(value) => setDraftAddress((current) => ({
                  ...current,
                  cityId: value,
                  city: value ? resolveLookupLabel(cities, value) : "",
                }))}
              />
              <CheckoutLookupField
                label="Postal code"
                value={draftAddress.postalCodeId}
                options={pincodes}
                placeholder="Search postal code"
                moduleKey="pincodes"
                onItemsChange={setPincodes}
                onChange={(value) => setDraftAddress((current) => ({
                  ...current,
                  postalCodeId: value,
                  postalCode: value ? resolveLookupLabel(pincodes, value) : "",
                }))}
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={draftAddress.isDefault}
                onChange={(event) => setDraftAddress((current) => ({ ...current, isDefault: event.target.checked }))}
              />
              Set as default delivery address
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddressDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => { void handleSaveAddress() }} disabled={addressSaving}>
              {addressSaving ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save address"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
