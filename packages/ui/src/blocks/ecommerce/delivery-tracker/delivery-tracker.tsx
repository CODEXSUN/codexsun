import { CheckCircle2Icon, ClockIcon, ExternalLinkIcon, MapPinIcon, TruckIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../../components/button'
import { Badge } from '../../../components/badge'
import type { DeliveryTrackerProps } from './delivery-tracker-types'

export function DeliveryTracker({
  carrierName = 'FedEx Express',
  className,
  deliveryAddress,
  estimatedDelivery,
  milestones,
  onTrackCarrier,
  orderId,
  trackingNumber,
}: DeliveryTrackerProps) {
  const currentMilestone = milestones.find((m) => m.status === 'current') ?? milestones[milestones.length - 1]

  return (
    <div className={cn('space-y-6 rounded-2xl border border-border/80 bg-card p-6 shadow-xs', className)}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Order #{orderId}</span>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {carrierName}
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-foreground mt-0.5">
            Estimated Delivery: <span className="text-primary">{estimatedDelivery}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tracking Number: <span className="font-mono font-semibold text-foreground">{trackingNumber}</span>
          </p>
        </div>

        {onTrackCarrier && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs self-start sm:self-auto" onClick={onTrackCarrier}>
            <span>Track on {carrierName}</span>
            <ExternalLinkIcon className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Horizontal Milestone Tracker */}
      <div className="py-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {milestones.map((step, idx) => {
            const isCompleted = step.status === 'completed'
            const isCurrent = step.status === 'current'

            return (
              <div key={step.id} className="relative flex flex-col items-start space-y-2">
                {/* Step indicator circle */}
                <div className="flex items-center w-full">
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                      isCompleted && 'bg-emerald-600 text-white',
                      isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse',
                      !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2Icon className="size-4" />
                    ) : isCurrent ? (
                      <TruckIcon className="size-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  {idx < milestones.length - 1 && (
                    <div
                      className={cn(
                        'h-1 w-full ml-2 rounded-full hidden sm:block',
                        isCompleted ? 'bg-emerald-600' : 'bg-border/60'
                      )}
                    />
                  )}
                </div>

                <div className="text-left space-y-0.5">
                  <h5 className={cn('text-xs font-bold', isCurrent ? 'text-primary' : 'text-foreground')}>
                    {step.title}
                  </h5>
                  {step.date && <p className="text-[11px] text-muted-foreground">{step.date}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status Highlights & Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <ClockIcon className="size-3.5 text-primary" />
            <span>Latest Update</span>
          </div>
          <p className="text-muted-foreground">{currentMilestone?.description ?? 'In transit'}</p>
          {currentMilestone?.location && (
            <p className="text-[11px] text-muted-foreground/80 font-medium">Location: {currentMilestone.location}</p>
          )}
        </div>

        {deliveryAddress && (
          <div className="space-y-1 md:border-l md:border-border/60 md:pl-4">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <MapPinIcon className="size-3.5 text-primary" />
              <span>Destination Address</span>
            </div>
            <p className="text-muted-foreground">{deliveryAddress}</p>
          </div>
        )}
      </div>

      {/* Detailed Tracking Events List */}
      <div className="space-y-3 pt-2">
        <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Tracking History</h5>
        <div className="space-y-3 border-l-2 border-border/80 pl-4 ml-1">
          {milestones.map((m) => (
            <div key={m.id} className="relative space-y-0.5 text-xs">
              <div
                className={cn(
                  'absolute -left-[21px] top-1 size-2 rounded-full',
                  m.status === 'completed'
                    ? 'bg-emerald-600'
                    : m.status === 'current'
                    ? 'bg-primary ring-2 ring-primary/30'
                    : 'bg-muted-foreground/40'
                )}
              />
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-foreground">{m.title}</span>
                <span className="text-[11px] text-muted-foreground">{m.time ?? m.date}</span>
              </div>
              {m.description && <p className="text-muted-foreground">{m.description}</p>}
              {m.location && <p className="text-[10px] text-muted-foreground/70">{m.location}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
