import { useState } from 'react'
import { ArrowRight, Leaf, PackageCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import { CategoryShowcase, type StoreCategoryCard } from '@codexsun/ui/blocks/ecommerce/categories'
import { SiteFooter } from '@codexsun/ui/blocks/footer'
import { ProductCard, type ProductItem } from '@codexsun/ui/blocks/product-card'
import { Button } from '@codexsun/ui/components/button'
import { EcommerceHeader } from '@codexsun/ui/layouts/ecommerce-header'

const categories: readonly StoreCategoryCard[] = [
  {
    href: '#home',
    id: 'home',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80',
    itemCount: 126,
    subtitle: 'Quiet objects for your everyday spaces',
    title: 'Home rituals',
  },
  {
    href: '#wear',
    id: 'wear',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80',
    itemCount: 84,
    subtitle: 'Soft layers made for repeat wear',
    title: 'Wear well',
  },
  {
    href: '#field',
    id: 'field',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=80',
    itemCount: 61,
    subtitle: 'Utility for open-air weekends',
    title: 'Into the field',
  },
  {
    href: '#gifting',
    id: 'gifting',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80',
    itemCount: 42,
    subtitle: 'Useful gifts, thoughtfully wrapped',
    title: 'Give beautifully',
  },
]

const products: readonly ProductItem[] = [
  {
    brand: 'Linden Studio',
    id: 'linen-throw',
    imageUrl: 'https://images.unsplash.com/photo-1583845112203-454c8d1e6e4a?auto=format&fit=crop&w=900&q=80',
    price: 86,
    rating: 4.9,
    reviewCount: 48,
    title: 'Washed linen throw',
  },
  {
    brand: 'Common Form',
    id: 'stone-mug',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80',
    price: 34,
    rating: 4.8,
    reviewCount: 112,
    title: 'Hand-thrown morning mug',
  },
  {
    brand: 'North Line',
    id: 'weekender',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    isNew: true,
    price: 148,
    rating: 4.9,
    reviewCount: 31,
    title: 'Waxed canvas weekender',
  },
  {
    brand: 'Sundial',
    discountPercent: 15,
    id: 'lamp',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
    originalPrice: 112,
    price: 95,
    rating: 4.7,
    reviewCount: 67,
    title: 'Dimmable table lamp',
  },
]

export function App() {
  const [cartCount, setCartCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isRelaxed, setIsRelaxed] = useState(true)

  function addToCart(product: ProductItem) {
    setCartCount((count) => count + 1)
    setFeedback(`${product.title} added to your local cart.`)
  }

  return (
    <div className={isRelaxed ? 'eshop-page eshop-page--relaxed' : 'eshop-page'}>
      <EcommerceHeader
        actions={{
          cartCount,
          cartSubtotal: cartCount ? `$${(cartCount * 42).toFixed(2)}` : '$0.00',
          onAccountClick: () => setFeedback('Account is not available in this static preview.'),
          onCartClick: () => setFeedback(`${cartCount} item${cartCount === 1 ? '' : 's'} in your local cart.`),
          onSearch: (query) => setFeedback(`Search is a preview: “${query || 'all collections'}”.`),
          onWishlistClick: () => setFeedback('Wishlist is not available in this static preview.'),
        }}
        announcement={{ message: 'Complimentary shipping on orders over $75.' }}
        brand={{ href: '#top', title: 'Verve Supply' }}
        categories={categories.map(({ href, id, title }) => ({ href, id, label: title }))}
        quickLinks={[{ href: '#featured', label: 'New arrivals' }, { href: '#journal', label: 'Our journal' }]}
      />

      <main id="top">
        <section className="eshop-hero">
          <div className="eshop-hero__copy">
            <p className="eshop-eyebrow"><Sparkles aria-hidden="true" /> Autumn collection</p>
            <h1>Make room for the good things.</h1>
            <p>Considered pieces for slower mornings, fuller tables, and weekends outdoors.</p>
            <Button onClick={() => setFeedback('Collection browsing is coming soon.')}>Shop the collection <ArrowRight aria-hidden="true" /></Button>
          </div>
          <img alt="Sunlit table with a ceramic vase and seasonal branches" src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85" />
        </section>

        <section className="eshop-section" id="collections">
          <CategoryShowcase categories={categories} columns={4} description="A useful edit for home, away, and in between." onSelectCategory={(id) => setFeedback(`Selected ${categories.find((category) => category.id === id)?.title ?? 'collection'}.`)} title="Find your rhythm" />
        </section>

        <section className="eshop-section" id="featured">
          <div className="eshop-section__heading">
            <div>
              <p className="eshop-eyebrow">The weekly edit</p>
              <h2>Objects worth keeping close</h2>
            </div>
            <Button size="sm" variant="outline" onClick={() => setFeedback('The complete catalogue is not available in this static preview.')}>View all <ArrowRight aria-hidden="true" /></Button>
          </div>
          <div className="eshop-products">
            {products.map((product) => <ProductCard key={product.id} product={product} onAddToCart={addToCart} onQuickView={(item) => setFeedback(`${item.title} has no detail page in this static preview.`)} onToggleWishlist={(item, active) => setFeedback(`${item.title} ${active ? 'saved to' : 'removed from'} your local wishlist.`)} />)}
          </div>
        </section>

        <section className="eshop-promotion" id="journal">
          <img alt="Hiker looking over a forested valley" src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85" />
          <div>
            <p className="eshop-eyebrow"><Leaf aria-hidden="true" /> Made for outside</p>
            <h2>Take less. Go farther.</h2>
            <p>Meet the durable layers and carry goods selected for crisp air and unplanned detours.</p>
            <Button variant="secondary" onClick={() => setFeedback('Field collection browsing is coming soon.')}>Explore field notes <ArrowRight aria-hidden="true" /></Button>
          </div>
        </section>

        <section className="eshop-promises" aria-label="Shopping promises">
          <div><Truck aria-hidden="true" /><span><strong>Free delivery</strong>On orders over $75</span></div>
          <div><PackageCheck aria-hidden="true" /><span><strong>Easy returns</strong>Within 30 days</span></div>
          <div><ShoppingBag aria-hidden="true" /><span><strong>Thoughtful packing</strong>Ready to give</span></div>
        </section>
      </main>

      <SiteFooter brand={{ description: 'An intentional edit of home, field, and everyday goods.', title: 'Verve Supply' }} columns={[{ links: [{ href: '#collections', label: 'Collections' }, { href: '#featured', label: 'New arrivals' }], title: 'Shop' }, { links: [{ href: '#journal', label: 'Field notes' }, { href: '#top', label: 'Our approach' }], title: 'About' }]} newsletter={{ description: 'A small note from the studio, sent occasionally.', onSubscribe: (email) => setFeedback(`${email} is subscribed in this static preview.`), title: 'Keep in touch' }} paymentBadges={['VISA', 'MC', 'AMEX']} />

      <p aria-live="polite" className="eshop-feedback">{feedback}</p>
      <aside className="eshop-tweak" aria-label="Landing page display controls">
        <span>Spacing</span>
        <Button size="sm" variant={isRelaxed ? 'default' : 'outline'} onClick={() => setIsRelaxed(true)}>Relaxed</Button>
        <Button size="sm" variant={!isRelaxed ? 'default' : 'outline'} onClick={() => setIsRelaxed(false)}>Compact</Button>
      </aside>
    </div>
  )
}
