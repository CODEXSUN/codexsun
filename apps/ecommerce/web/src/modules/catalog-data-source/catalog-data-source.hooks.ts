import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCatalogDataSource,
  saveCatalogDataSource,
  saveStorefrontSectionVisibility,
  syncCatalogDataSource,
  testCatalogDataSource
} from "./catalog-data-source.services";
import type {
  CatalogDataSourceModule,
  CatalogDataSourceProvider
} from "./catalog-data-source.types";

export const catalogDataSourceQueryKey = ["ecommerce", "catalog-data-source"] as const;

export function useCatalogDataSource() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryFn: getCatalogDataSource, queryKey: catalogDataSourceQueryKey });
  const save = useMutation({
    mutationFn: (input: { module: CatalogDataSourceModule; provider: CatalogDataSourceProvider }) =>
      saveCatalogDataSource(input),
    onSuccess: (value) => queryClient.setQueryData(catalogDataSourceQueryKey, value)
  });
  const test = useMutation({
    mutationFn: (provider: CatalogDataSourceProvider) => testCatalogDataSource(provider)
  });
  const sync = useMutation({ mutationFn: syncCatalogDataSource });
  const visibility = useMutation({
    mutationFn: saveStorefrontSectionVisibility,
    onSuccess: (value) => queryClient.setQueryData(catalogDataSourceQueryKey, value)
  });
  return { save, settings, sync, test, visibility };
}
