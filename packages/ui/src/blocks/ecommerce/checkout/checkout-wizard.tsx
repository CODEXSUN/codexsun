import { useState } from 'react'
import {
  CheckCircle2Icon,
  CreditCardIcon,
  LockIcon,
  MapPinIcon,
  ShieldCheckIcon,
  TruckIcon,
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import type {
  CheckoutAddress,
  CheckoutPaymentSelection,
  CheckoutShippingOption,
  CheckoutWizardProps,
} from './checkout-types'

const defaultOptions: readonly CheckoutShippingOption[] = [
  { deliveryEstimate: '3–5 business days', id: 'standard', label: 'Standard Delivery', price: 'FREE', priceValue: 0 },
  { deliveryEstimate: '1–2 business days', id: 'express', label: 'Express Courier', price: '$12.00', priceValue: 12 },
  { deliveryEstimate: 'Tomorrow by 12 PM', id: 'overnight', label: 'Priority Overnight', price: '$24.00', priceValue: 24 },
]

export function CheckoutWizard({
  className,
  currencySymbol = '$',
  defaultAddress,
  initialStep = 1,
  items,
  onPlaceOrder,
  shippingOptions = defaultOptions,
  subtotal,
}: CheckoutWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep)
  const [address, setAddress] = useState<CheckoutAddress>({
    city: defaultAddress?.city ?? 'San Francisco',
    country: defaultAddress?.country ?? 'United States',
    fullName: defaultAddress?.fullName ?? 'Alex Morgan',
    phone: defaultAddress?.phone ?? '+1 (555) 349-2041',
    postalCode: defaultAddress?.postalCode ?? '94107',
    state: defaultAddress?.state ?? 'CA',
    streetAddress: defaultAddress?.streetAddress ?? '450 Mission Street, Suite 800',
  })

  const [selectedShipping, setSelectedShipping] = useState<CheckoutShippingOption>(
    shippingOptions[0] ?? defaultOptions[0]!
  )

  const [payment, setPayment] = useState<CheckoutPaymentSelection>({
    cvv: '884',
    method: 'card',
    savedCardId: 'card-1',
  })

  const total = subtotal + selectedShipping.priceValue

  const handlePlaceOrder = () => {
    onPlaceOrder?.({
      address,
      payment,
      shipping: selectedShipping,
    })
  }

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-8', className)}>
      {/* Left Column: Multi-Step Flow */}
      <div className="lg:col-span-8 space-y-6">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          {[
            { num: 1, title: 'Shipping & Delivery', icon: MapPinIcon },
            { num: 2, title: 'Payment Method', icon: CreditCardIcon },
            { num: 3, title: 'Review & Place Order', icon: ShieldCheckIcon },
          ].map((s, idx) => {
            const isDone = step > s.num
            const isCurrent = step === s.num
            const Icon = isDone ? CheckCircle2Icon : s.icon

            return (
              <div key={s.num} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => isDone && setStep(s.num as 1 | 2 | 3)}
                  disabled={!isDone}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                    isDone && 'bg-emerald-600 text-white cursor-pointer',
                    isCurrent && 'bg-primary text-primary-foreground shadow-xs',
                    !isDone && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="size-4" />
                </button>
                <div className="hidden sm:block text-left">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Step {s.num}</div>
                  <div className={cn('text-xs font-semibold', isCurrent ? 'text-foreground' : 'text-muted-foreground')}>
                    {s.title}
                  </div>
                </div>
                {idx < 2 && <div className="h-px w-8 bg-border hidden md:block ml-2" />}
              </div>
            )
          })}
        </div>

        {/* Step 1: Shipping Address & Delivery Speed */}
        {step === 1 && (
          <div className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Shipping Destination</h3>
                <p className="text-xs text-muted-foreground">Where should we deliver your order?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-foreground">Full Name</label>
                <input
                  type="text"
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full rounded-lg border border-input bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-foreground">Street Address</label>
                <input
                  type="text"
                  value={address.streetAddress}
                  onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
                  className="w-full rounded-lg border border-input bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">City</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full rounded-lg border border-input bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">State / Region</label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full rounded-lg border border-input bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Postal / Zip Code</label>
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  className="w-full rounded-lg border border-input bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Phone Number</label>
                <input
                  type="text"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full rounded-lg border border-input bg-muted/20 px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Shipping Speed Options */}
            <div className="pt-4 border-t border-border/60 space-y-3">
              <label className="text-xs font-bold text-foreground">Select Delivery Speed</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {shippingOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedShipping(opt)}
                    className={cn(
                      'flex flex-col text-left p-3.5 rounded-xl border transition-all text-xs',
                      selectedShipping.id === opt.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/80 bg-muted/20 hover:border-border'
                    )}
                  >
                    <div className="flex items-center justify-between font-bold text-foreground">
                      <span>{opt.label}</span>
                      <span className="text-primary">{opt.price}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1">{opt.deliveryEstimate}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)}>Continue to Payment</Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && (
          <div className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Payment Method</h3>
                <p className="text-xs text-muted-foreground">Transactions are 256-bit encrypted and secured.</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                <LockIcon className="size-3.5" />
                <span>SSL Encrypted</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'card', label: 'Credit Card' },
                { id: 'upi', label: 'UPI / QR' },
                { id: 'wallet', label: 'Wallets' },
                { id: 'cod', label: 'Cash on Delivery' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayment({ ...payment, method: m.id as CheckoutPaymentSelection['method'] })}
                  className={cn(
                    'rounded-xl border p-3 text-xs font-bold transition-all text-center',
                    payment.method === m.id
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border/80 bg-muted/20 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Card Form */}
            {payment.method === 'card' && (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Card Number</label>
                  <input
                    type="text"
                    disabled
                    value="•••• •••• •••• 4242 (Visa Platinum)"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground opacity-80"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Expiry Date</label>
                    <input
                      type="text"
                      disabled
                      value="08 / 29"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground opacity-80"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">CVV Security Code</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={payment.cvv}
                      onChange={(e) => setPayment({ ...payment, cvv: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {payment.method === 'upi' && (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-xs space-y-2">
                <label className="font-semibold text-foreground">Enter UPI Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  placeholder="username@okaxis or mobile@upi"
                  value={payment.upiId ?? ''}
                  onChange={(e) => setPayment({ ...payment, upiId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back to Shipping
              </Button>
              <Button onClick={() => setStep(3)}>Review Order</Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Place Order */}
        {step === 3 && (
          <div className="space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div className="border-b border-border/60 pb-4">
              <h3 className="text-base font-bold text-foreground">Final Order Review</h3>
              <p className="text-xs text-muted-foreground">Please double check your shipping and payment selection.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>Shipping Address</span>
                  <button type="button" onClick={() => setStep(1)} className="text-primary hover:underline">
                    Edit
                  </button>
                </div>
                <div className="text-muted-foreground">
                  <p className="font-semibold text-foreground">{address.fullName}</p>
                  <p>{address.streetAddress}</p>
                  <p>{address.city}, {address.state} {address.postalCode}</p>
                  <p>{address.phone}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>Payment & Delivery</span>
                  <button type="button" onClick={() => setStep(2)} className="text-primary hover:underline">
                    Edit
                  </button>
                </div>
                <div className="text-muted-foreground">
                  <p className="font-semibold text-foreground capitalize">Method: {payment.method}</p>
                  <p>Delivery: {selectedShipping.label}</p>
                  <p>Speed: {selectedShipping.deliveryEstimate}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back to Payment
              </Button>
              <Button size="lg" className="gap-2 px-6" onClick={handlePlaceOrder}>
                <ShieldCheckIcon className="size-4" />
                <span>Place Order ({currencySymbol}{total.toFixed(2)})</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Order Items Summary */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h4 className="text-sm font-bold text-foreground">Order Summary</h4>
            <span className="text-xs text-muted-foreground">{items.length} items</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 text-xs">
                <img src={it.image} alt={it.title} className="size-12 rounded-lg object-cover bg-muted border" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{it.title}</div>
                  <div className="text-[11px] text-muted-foreground">Qty: {it.quantity}</div>
                </div>
                <div className="font-bold text-foreground">{it.price}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="font-semibold text-foreground">{selectedShipping.price}</span>
            </div>
            <div className="border-t border-border/60 pt-2 flex justify-between text-base font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary">{currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Guarantee Banner */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs flex items-center gap-3">
          <TruckIcon className="size-5 text-primary shrink-0" />
          <div className="text-muted-foreground">
            <strong className="text-foreground">Free Returns within 30 days</strong>. If you are not satisfied, return for a full refund.
          </div>
        </div>
      </div>
    </div>
  )
}
