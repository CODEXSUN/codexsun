import * as React from "react"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, alt = "", ...props }: React.ComponentProps<"img">) {
  return (
    <img
      data-slot="avatar-image"
      alt={alt}
      className={cn("size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-muted text-xs font-semibold uppercase",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
