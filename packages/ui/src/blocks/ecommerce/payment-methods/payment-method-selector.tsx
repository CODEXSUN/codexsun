import { useState } from 'react'
import { BanknoteIcon, CreditCardIcon, PlusIcon, QrCodeIcon, ShieldCheckIcon, WalletIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import { Badge } from '../../../components/badge'
import type { PaymentMethodSelectorProps } from './payment-methods-types'

export function PaymentMethodSelector({
  allowCOD = true,
  className,
  onAddNewCard,
  onSelectMethod,
  savedCards,
  selectedMethod: initialMethod = 'card',
}: PaymentMethodSelectorProps) {
  const [method, setMethod] = useState<'card' | 'upi' | 'wallet' | 'cod'>(initialMethod)
  const [selectedCardId, setSelectedCardId] = useState<string>(
    savedCards.find((c) => c.isDefault)?.id ?? savedCards[0]?.id ?? ''
  )
  const [cvv, setCvv] = useState('')
  const [upiId, setUpiId] = useState('')

  const handleMethodChange = (newMethod: 'card' | 'upi' | 'wallet' | 'cod') => {
    setMethod(newMethod)
    onSelectMethod?.(newMethod, { cardId: selectedCardId, upiId })
  }

  return (
    <div className={cn('space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Payment Options</h3>
          <p className="text-xs text-muted-foreground">Select how you would like to complete your purchase.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
          <ShieldCheckIcon className="size-4" />
          <span>PCI-DSS Compliant</span>
        </div>
      </div>

      {/* Main Method Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'card', label: 'Cards', icon: CreditCardIcon },
          { id: 'upi', label: 'UPI / QR', icon: QrCodeIcon },
          { id: 'wallet', label: 'Wallets', icon: WalletIcon },
          ...(allowCOD ? [{ id: 'cod', label: 'Cash on Delivery', icon: BanknoteIcon }] : []),
        ].map((m) => {
          const Icon = m.icon
          const isSelected = method === m.id

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => handleMethodChange(m.id as 'card' | 'upi' | 'wallet' | 'cod')}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-2',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-xs'
                  : 'border-border/80 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>

      {/* 1. Credit / Debit Cards Mode */}
      {method === 'card' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Your Saved Cards</span>
            {onAddNewCard && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onAddNewCard}>
                <PlusIcon className="size-3.5" />
                <span>Add Card</span>
              </Button>
            )}
          </div>

          <div className="space-y-2.5">
            {savedCards.map((card) => {
              const isSelected = selectedCardId === card.id

              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedCardId(card.id)
                    onSelectMethod?.('card', { cardId: card.id })
                  }}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition-all text-xs',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/80 bg-muted/10 hover:border-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-background border border-border/80 font-mono font-bold uppercase text-[10px]">
                      {card.brand}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <span>•••• •••• •••• {card.last4}</span>
                        {card.isDefault && (
                          <Badge variant="secondary" className="text-[10px] py-0 font-semibold">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {card.cardholderName} • Expires {card.expiryMonth}/{card.expiryYear}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[11px] font-semibold text-foreground">CVV:</span>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-14 rounded border border-input bg-background px-2 py-1 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 2. UPI / QR Mode */}
      {method === 'upi' && (
        <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <QrCodeIcon className="size-4 text-primary" />
            <span>Instant UPI Payment</span>
          </div>
          <p className="text-muted-foreground">Pay directly from Google Pay, PhonePe, Paytm, or BHIM.</p>
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="e.g. mobileNumber@upi or user@okhdfcbank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              size="sm"
              disabled={!upiId.includes('@')}
              onClick={() => onSelectMethod?.('upi', { upiId })}
            >
              Verify UPI ID
            </Button>
          </div>
        </div>
      )}

      {/* 3. Wallets Mode */}
      {method === 'wallet' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {['Apple Pay', 'Google Pay', 'PayPal'].map((wallet) => (
            <button
              key={wallet}
              type="button"
              onClick={() => onSelectMethod?.('wallet')}
              className="flex items-center justify-center gap-2 p-4 rounded-xl border border-border/80 bg-muted/20 hover:border-primary hover:bg-primary/5 transition-all text-xs font-bold text-foreground"
            >
              <WalletIcon className="size-4 text-primary" />
              <span>{wallet}</span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Cash on Delivery Mode */}
      {method === 'cod' && (
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <BanknoteIcon className="size-4 text-primary" />
            <span>Pay with Cash Upon Delivery</span>
          </div>
          <p className="text-muted-foreground">
            You can pay the courier agent via cash or mobile QR scan at your doorstep. Please keep exact change ready.
          </p>
        </div>
      )}
    </div>
  )
}
