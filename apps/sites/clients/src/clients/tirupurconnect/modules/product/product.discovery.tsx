import { ArrowUpRight, Package, Search } from "lucide-react";
import type { PublicCatalogProduct } from "@codexsun/tconnect-web/public";
export function ProductDiscovery({ products }: { products: PublicCatalogProduct[] }) {
  if (!products.length)
    return (
      <div className="tc-empty">
        <Search size={28} />
        <h3>No matching products yet.</h3>
        <p>Try another category or tell sellers what you need.</p>
        <a className="tc-button" href="/register/buyer">
          Post a requirement
        </a>
      </div>
    );
  return (
    <div className="tc-product-discovery-grid">
      {products.map((product) => (
        <article className="tc-discovery-product" key={product.uuid}>
          <a
            href={`/companies/${product.sellerSlug}?product=${product.uuid}#products`}
            className="tc-discovery-product-image"
          >
            {product.imageDataUrl ? (
              <img
                src={product.imageDataUrl}
                alt={product.name}
                loading="lazy"
                width="480"
                height="360"
              />
            ) : (
              <div>
                <Package size={38} />
                <span>{product.category}</span>
                <small>Product image not supplied</small>
              </div>
            )}
          </a>
          <div className="tc-discovery-product-copy">
            <span className="tc-eyebrow">{product.category}</span>
            <h3>
              <a href={`/companies/${product.sellerSlug}?product=${product.uuid}#products`}>
                {product.name}
              </a>
            </h3>
            <p>
              {product.sellerName} · {product.city}
            </p>
            <strong>
              {product.price === null
                ? "Price on request"
                : `₹${product.price.toLocaleString("en-IN")} / ${product.unit}`}
            </strong>
            <span className="tc-product-moq">MOQ: {product.minimumOrder}</span>
            <p className="tc-product-excerpt">{product.description}</p>
            <a
              className="tc-text-link"
              href={`/companies/${product.sellerSlug}?product=${product.uuid}&enquire=1`}
            >
              Enquire about this product <ArrowUpRight size={17} />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
