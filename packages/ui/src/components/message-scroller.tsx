import * as React from "react";
import { ArrowDownIcon } from "lucide-react";
import { cn } from "../lib/utils";

import { Button } from "@codexsun/ui/components/button";

function MessageScrollerProvider({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}

function MessageScroller({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-scroller"
      className={cn("group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden", className)}
      {...props}
    />
  );
}

function MessageScrollerViewport({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-scroller-viewport"
      className={cn(
        "size-full min-h-0 min-w-0 scroll-fade scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content",
        className,
      )}
      {...props}
    />
  );
}

function MessageScrollerContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-scroller-content"
      className={cn("flex h-max min-h-full flex-col gap-6", className)}
      {...props}
    />
  );
}

function MessageScrollerItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-scroller-item"
      className={cn("min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]", className)}
      {...props}
    />
  );
}

function MessageScrollerButton({
  direction = "end",
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { direction?: "start" | "end" }) {
  return (
    <Button
      aria-label={direction === "end" ? "Scroll to end" : "Scroll to start"}
      className={cn(
        "absolute inset-s-1/2 -translate-x-1/2 border-border bg-background text-foreground data-[direction=end]:bottom-4 data-[direction=start]:top-4 rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180 group-hover/message-scroller:visible group-hover/message-scroller:opacity-100",
        className,
      )}
      data-direction={direction}
      size="icon-sm"
      variant="secondary"
      {...props}
    >
      {children ?? <ArrowDownIcon />}
    </Button>
  );
}

const useMessageScroller = () => undefined;
const useMessageScrollerScrollable = () => false;
const useMessageScrollerVisibility = () => false;

export {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
