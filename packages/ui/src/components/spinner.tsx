import { cn } from 'cn'
import { Loader2Icon } from 'lucide-react'

function Spinner({
  className,
  animated = true,
  ...props
}: React.ComponentProps<'svg'> & { animated?: boolean }) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn('size-4', animated && 'motion-safe:animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
