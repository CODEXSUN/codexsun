import { Share2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { showInfoToast, showSuccessToast } from '@/shared/notifications/toast'

interface ShareButtonProps {
  productName: string
  size?: 'icon' | 'pill'
}

export function ShareButton({ productName, size = 'icon' }: ShareButtonProps) {
  async function handleShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({
        title: productName,
        text: `Check out ${productName} on codexsun.`,
        url: shareUrl,
      })
      return
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl)
      showSuccessToast({
        title: 'Link copied',
        description: `${productName} link copied to your clipboard.`,
      })
      return
    }

    showInfoToast({
      title: 'Share unavailable',
      description: 'This browser does not support direct sharing here.',
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size === 'pill' ? 'default' : 'icon'}
      className={size === 'pill' ? 'rounded-full px-4' : 'rounded-full'}
      onClick={() => void handleShare()}
      aria-label={`Share ${productName}`}
    >
      <Share2Icon className="size-4" />
      {size === 'pill' ? 'Share' : null}
    </Button>
  )
}
