import { MenuIcon, SearchIcon, ShoppingBagIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import type { EcommerceCategoryItem, EcommerceHeaderActions } from "./ecommerce-header-types";

type EcommerceDrawerProps = {
  actions?: EcommerceHeaderActions;
  brandTitle: string;
  cartCount: number;
  categories: readonly EcommerceCategoryItem[];
};

export function EcommerceDrawer({ actions, brandTitle, cartCount, categories }: EcommerceDrawerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <>
      <Button
        aria-label="Open storefront navigation"
        className="size-9 md:hidden"
        size="icon"
        variant="ghost"
        onClick={() => setOpen(true)}
      >
        <MenuIcon className="size-5" />
      </Button>
      {open ? (
        <DrawerPanel
          actions={actions}
          brandTitle={brandTitle}
          cartCount={cartCount}
          categories={categories}
          query={query}
          onClose={() => setOpen(false)}
          onQueryChange={setQuery}
        />
      ) : null}
    </>
  );
}

function DrawerPanel({
  actions,
  brandTitle,
  cartCount,
  categories,
  query,
  onClose,
  onQueryChange,
}: EcommerceDrawerProps & { query: string; onClose: () => void; onQueryChange: (value: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm md:hidden">
      <div className="flex w-full max-w-xs flex-col justify-between border-r border-border/80 bg-background p-6 shadow-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{brandTitle}</span>
            <Button aria-label="Close storefront navigation" size="icon" variant="ghost" onClick={onClose}>
              <XIcon className="size-5" />
            </Button>
          </div>
          <div className="flex items-center rounded-lg border border-input bg-muted/40 px-3 py-1.5">
            <SearchIcon className="mr-2 size-4 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm focus:outline-none"
              placeholder="Search store..."
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Categories</p>
            {categories.map((category) => (
              <a
                className="flex items-center justify-between rounded-lg p-2 text-sm font-medium text-foreground hover:bg-muted"
                href={category.href}
                key={category.id}
              >
                <span>{category.label}</span>
                {category.isHot ? <Badge variant="destructive">Hot</Badge> : null}
              </a>
            ))}
          </div>
        </div>
        <div className="space-y-2 border-t border-border pt-6">
          <Button className="w-full gap-2" onClick={actions?.onCartClick}>
            <ShoppingBagIcon className="size-4" />
            <span>View Cart ({cartCount})</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
