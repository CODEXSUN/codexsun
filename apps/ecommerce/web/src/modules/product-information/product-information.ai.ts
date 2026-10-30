import type {
  CoreBrandOption,
  CoreProductOption,
  FrappeItemOption,
  ProductInformationPayload
} from "./product-information.types";

export function buildPikoItemDraft({
  brands,
  coreProducts,
  frappeItem,
  value
}: {
  brands: CoreBrandOption[];
  coreProducts: CoreProductOption[];
  frappeItem: FrappeItemOption | null;
  value: ProductInformationPayload;
}) {
  const context = {
    request:
      "Review this item and help improve its storefront content. Preserve verified facts, identify missing information, and do not invent specifications.",
    frappeItem,
    details: {
      coreProduct: coreProducts.find((item) => item.id === value.coreProductId) ?? null,
      brand: brands.find((item) => item.id === value.brandId) ?? null,
      publicationStatus: value.publicationStatus,
      storefrontTitle: value.storefrontTitle,
      subtitle: value.subtitle,
      slug: value.slug,
      manufacturer: value.manufacturer,
      material: value.material,
      countryOfOrigin: value.countryOfOrigin,
      shortDescription: value.shortDescription,
      isFeatured: value.isFeatured
    },
    fulfilment: {
      shippingClass: value.shippingClass,
      weight: value.weight,
      length: value.length,
      width: value.width,
      height: value.height,
      minimumOrderQuantity: value.minimumOrderQuantity,
      maximumOrderQuantity: value.maximumOrderQuantity,
      warranty: value.warranty,
      returnPolicy: value.returnPolicy
    },
    contentAndSeo: {
      description: value.description,
      bulletPoints: value.bulletPoints,
      seoTitle: value.seoTitle,
      seoDescription: value.seoDescription
    }
  };

  return `Help me complete this item. Review the draft below and wait for my instructions.\n\n${JSON.stringify(context, null, 2)}`;
}
