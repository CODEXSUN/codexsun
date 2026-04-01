import { useState } from "react"

export function ProductGallery({ images, fallbackUrl }: { images: string[]; fallbackUrl: string }) {
  const [activeUrl, setActiveUrl] = useState(images[0] ?? fallbackUrl)
  const hasImage = Boolean(activeUrl)

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card">
        {hasImage ? (
          <img src={activeUrl} alt="Product" className="aspect-square w-full object-cover" decoding="async" fetchPriority="high" />
        ) : (
          <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
            Product image unavailable
          </div>
        )}
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image) => (
            <button
              key={image}
              type="button"
              className="overflow-hidden rounded-2xl border border-border/60"
              onClick={() => setActiveUrl(image)}
            >
              <img src={image} alt="Product preview" className="aspect-square w-full object-cover" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
