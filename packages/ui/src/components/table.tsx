import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../libs/utils";

const tableVariants = cva("w-full caption-bottom text-sm", {
  variants: {
    density: {
      default: "[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3",
      dense: "[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2",
    },
  },
  defaultVariants: { density: "default" },
});

function Table({
  className,
  density,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & VariantProps<typeof tableVariants>) {
  return <table className={cn(tableVariants({ density, className }))} {...props} />;
}

function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-border text-left text-muted-foreground", className)} {...props} />;
}

function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-b-0", className)} {...props} />;
}

function TableRow({ className, selectable, ...props }: HTMLAttributes<HTMLTableRowElement> & { selectable?: boolean }) {
  return (
    <tr
      className={cn("border-b border-border", selectable && "cursor-pointer hover:bg-surface-raised", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("h-10 text-left align-middle font-medium", className)} {...props} />;
}

function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("align-middle", className)} {...props} />;
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, tableVariants };
