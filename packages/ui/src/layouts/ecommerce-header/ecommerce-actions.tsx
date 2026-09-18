import { HeartIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../../components/button";
import type { EcommerceHeaderActions } from "./ecommerce-header-types";

type EcommerceActionsProps = {
  actions?: EcommerceHeaderActions;
};

export function EcommerceActions({ actions }: EcommerceActionsProps) {
  const cartCount = actions?.cartCount ?? 0;
  const wishlistCount = actions?.wishlistCount ?? 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <CountAction count={wishlistCount} label="Wishlist" onClick={actions?.onWishlistClick}>
        <HeartIcon className="size-5" />
      </CountAction>
      <CartAction actions={actions} count={cartCount} />
      <Button
        aria-label="User account"
        className="px-2.5 text-muted-foreground hover:text-foreground"
        size="sm"
        variant="ghost"
        onClick={actions?.onAccountClick}
      >
        <UserIcon className="size-5" />
        <span className="ml-1.5 hidden text-xs font-medium xl:inline-block">Account</span>
      </Button>
    </div>
  );
}

function CountAction({
  children,
  count,
  label,
  onClick,
}: {
  children: ReactNode;
  count: number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className="relative px-2.5 text-muted-foreground hover:text-foreground"
      size="sm"
      variant="ghost"
      onClick={onClick}
    >
      {children}
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
      <span className="ml-1.5 hidden text-xs font-medium xl:inline-block">{label}</span>
    </Button>
  );
}

function CartAction({ actions, count }: { actions?: EcommerceHeaderActions; count: number }) {
  return (
    <Button
      aria-label="Shopping cart"
      className="relative gap-2 px-3 shadow-xs"
      size="sm"
      onClick={actions?.onCartClick}
    >
      <span className="relative">
        <ShoppingBagIcon className="size-4" />
        {count > 0 ? (
          <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
      <span className="flex flex-col items-start text-left leading-none">
        <span className="text-xs font-semibold">Cart</span>
        {actions?.cartSubtotal ? (
          <span className="text-[10px] font-medium opacity-90">{actions.cartSubtotal}</span>
        ) : null}
      </span>
    </Button>
  );
}
