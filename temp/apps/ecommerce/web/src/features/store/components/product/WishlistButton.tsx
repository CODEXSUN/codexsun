import { HeartIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStorefront } from '@/features/store/context/storefront-context'
import { showInfoToast } from '@/shared/notifications/toast'

interface WishlistButtonProps {
  productId: string
  size?: 'icon' | 'pill'
}

export function WishlistButton({ productId, size = 'icon' }: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, products } = useStorefront()
  const active = isInWishlist(productId)
  const productName = products.find((entry) => entry.id === productId)?.name ?? 'Product'

  return (
    <Button
      type="button"
      variant="outline"
      size={size === 'pill' ? 'default' : 'icon'}
      className={size === 'pill' ? 'rounded-full px-4' : 'rounded-full'}
      onClick={() => {
        toggleWishlist(productId)
        showInfoToast({
          title: active ? 'Removed from wishlist' : 'Saved to wishlist',
          description: `${productName} ${active ? 'was removed from' : 'was added to'} your wishlist.`,
        })
      }}
      aria-label={active ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
    >
      <HeartIcon className={active ? 'size-4 fill-current' : 'size-4'} />
      {size === 'pill' ? (active ? 'Saved' : 'Wishlist') : null}
    </Button>
  )
}
