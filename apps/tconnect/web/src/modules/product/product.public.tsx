import { useEffect, useState } from "react";
import type { Product } from "./product.types";
import { publicProducts } from "./product.services";
export function PublicProducts({ companyUuid }: { companyUuid: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setProducts([]);
    publicProducts(companyUuid)
      .then((value) => {
        if (active) setProducts(value);
      })
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [companyUuid]);
  return (
    <div className="tc-public-products">
      {loading ? (
        <p role="status">Loading products…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !products.length ? (
        <p className="tc-product-empty">No products published yet. Ask this business about its current capabilities.</p>
      ) : (
        products.map((product) => (
          <article className="tc-public-product" key={product.uuid}>
            {product.imageDataUrl ? (
              <img src={product.imageDataUrl} alt={product.name} />
            ) : (
              <div className="tc-product-placeholder">{product.category}</div>
            )}
            <div>
              <span className="tc-eyebrow">{product.category}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>
                {product.price === null
                  ? "Price on request"
                  : `₹${product.price.toLocaleString("en-IN")} / ${product.unit}`}
              </strong>
              <small>Minimum order: {product.minimumOrder}</small>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
