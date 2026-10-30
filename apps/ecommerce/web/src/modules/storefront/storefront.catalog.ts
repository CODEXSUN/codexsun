import { useCallback, useEffect, useRef, useState } from "react";
import { listStorefrontProducts } from "./storefront.services";
import type { StorefrontFilters, StorefrontProduct } from "./storefront.types";

const PAGE_SIZE = 24;

export function useStorefrontCatalog(filters: StorefrontFilters) {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    setLoading(true);
    setProducts([]);
    setHasMore(true);
    setError("");
    listStorefrontProducts(filters, { limit: PAGE_SIZE, offset: 0 })
      .then((items) => {
        if (generation.current !== currentGeneration) return;
        setProducts(items);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch((reason: unknown) => {
        if (generation.current !== currentGeneration) return;
        setError(reason instanceof Error ? reason.message : "Products could not be loaded.");
        setHasMore(false);
      })
      .finally(() => {
        if (generation.current === currentGeneration) setLoading(false);
      });
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const currentGeneration = generation.current;
    try {
      const items = await listStorefrontProducts(filters, {
        limit: PAGE_SIZE,
        offset: products.length
      });
      if (generation.current !== currentGeneration) return;
      setProducts((current) => [...current, ...items]);
      setHasMore(items.length === PAGE_SIZE);
    } catch (reason) {
      if (generation.current !== currentGeneration) return;
      setError(reason instanceof Error ? reason.message : "More products could not be loaded.");
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      if (generation.current === currentGeneration) setLoadingMore(false);
    }
  }, [filters, hasMore, loading, products.length]);

  return { error, hasMore, loading, loadingMore, loadMore, products };
}
