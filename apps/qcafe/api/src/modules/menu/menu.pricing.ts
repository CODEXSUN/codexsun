import type { MenuItem, MenuSpecialPolicy } from "./menu.types.js";
export function priceQCafeMenu(items: MenuItem[], policy: MenuSpecialPolicy) {
  const definition = policy.enabled
    ? policy.definitions.find((item) => item.prefix === policy.selectedPrefix && item.isEnabled)
    : undefined;
  return items.map((item) => {
    const special = definition
      ? item.specialPrices.find((price) => price.prefix === definition.prefix && price.isEnabled)
      : undefined;
    return {
      ...item,
      normalPrice: item.price,
      price: special?.price ?? item.price,
      activeSpecial:
        special && definition ? { prefix: definition.prefix, name: definition.name } : null
    };
  });
}
