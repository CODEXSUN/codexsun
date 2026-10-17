export type MenuSpecialPrice = { prefix: string; price: number; isEnabled: boolean };
export type MenuInput = {
  code: string;
  name: string;
  category: string;
  imageUrl?: string | undefined;
  specialPrices?: MenuSpecialPrice[] | undefined;
  price: number;
  status: "active" | "inactive";
};
export type MenuItem = MenuInput & { uuid: string };
