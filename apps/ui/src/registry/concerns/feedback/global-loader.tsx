import type { HTMLAttributes } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

type LoaderSize = "sm" | "md" | "lg"

type GlobalLoaderProps = HTMLAttributes<HTMLDivElement> & {
  size?: LoaderSize
  fullScreen?: boolean
  label?: string
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: "size-30",
  md: "size-42",
  lg: "size-60",
}

export function GlobalLoader({
  size = "lg",
  fullScreen = true,
  label,
  className,
  ...props
}: GlobalLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8",
        fullScreen ? "min-h-screen" : "min-h-[40vh] w-full",
        className
      )}
      {...props}
    >
      <motion.div
        className={cn("relative", sizeClasses[size])}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{
          duration: 4,
          ease: [0.4, 0, 0.6, 1],
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        <div
          className="absolute inset-[22%] rounded-full border border-border/70 shadow-sm"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--background) 65%, var(--primary) 35%) 0%, color-mix(in oklab, var(--card) 92%, var(--secondary) 8%) 58%, color-mix(in oklab, var(--card) 84%, var(--accent) 16%) 100%)",
            boxShadow:
              "0 0 0 1px color-mix(in oklab, var(--border) 88%, transparent), 0 24px 48px color-mix(in oklab, var(--primary) 16%, transparent)",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, var(--accent) 90deg, transparent 180deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
            opacity: 0.8,
          }}
          animate={{ rotate: [0, 360] }}
          transition={{
            duration: 3,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--foreground) 90%, var(--primary) 10%) 120deg, color-mix(in oklab, var(--foreground) 48%, transparent) 240deg, transparent 360deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
            opacity: 0.9,
          }}
          animate={{ rotate: [0, 360] }}
          transition={{
            duration: 2.5,
            ease: [0.4, 0, 0.6, 1],
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 180deg, transparent 0deg, color-mix(in oklab, var(--foreground) 58%, transparent) 45deg, transparent 90deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
            opacity: 0.35,
          }}
          animate={{ rotate: [0, -360] }}
          transition={{
            duration: 4,
            ease: [0.4, 0, 0.6, 1],
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 270deg, transparent 0deg, color-mix(in oklab, var(--foreground) 38%, transparent) 20deg, transparent 40deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
            opacity: 0.5,
          }}
          animate={{ rotate: [0, 360] }}
          transition={{
            duration: 3.5,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="Codexsun logo"
            className="h-10 w-10 object-contain"
          />
        </div>
      </motion.div>
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : null}
    </div>
  )
}
