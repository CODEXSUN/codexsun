export type MenuSave = {
  code: string;
  name: string;
  category: string;
  imageUrl?: string | undefined;
  price: number;
  status: "active" | "inactive";
};
export type MenuItem = MenuSave & { uuid: string };
