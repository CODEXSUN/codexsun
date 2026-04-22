import { useState, type HTMLAttributes } from "react"

import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { resolveRuntimeBrandLogoUrl } from "@/features/branding/runtime-brand-logo"
import { cn } from "@/lib/utils"

type LoaderSize = "sm" | "md" | "lg"
type LoaderLogoVariant = "primary" | "dark"

type GlobalLoaderBrand = {
  darkLogoUrl?: string | null
  logoUrl?: string | null
}

export type GlobalLoaderDesign = {
  logoVariant?: LoaderLogoVariant | null
  frameWidth?: number | null
  frameHeight?: number | null
  logoWidth?: number | null
  logoHeight?: number | null
  offsetX?: number | null
  offsetY?: number | null
  logoBackgroundColor?: string | null
}

type ResolvedGlobalLoaderDesign = {
  logoVariant: LoaderLogoVariant
  frameWidth: number
  frameHeight: number
  logoWidth: number
  logoHeight: number
  offsetX: number
  offsetY: number
  logoBackgroundColor: string
}

type GlobalLoaderProps = HTMLAttributes<HTMLDivElement> & {
  size?: LoaderSize
  fullScreen?: boolean
  label?: string
  brandOverride?: GlobalLoaderBrand | null
  designOverride?: GlobalLoaderDesign | null
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: "size-30",
  md: "size-42",
  lg: "size-60",
}

const defaultGlobalLoaderDesign: ResolvedGlobalLoaderDesign = {
  logoVariant: "primary",
  frameWidth: 88,
  frameHeight: 88,
  logoWidth: 40,
  logoHeight: 40,
  offsetX: 0,
  offsetY: 0,
  logoBackgroundColor: "#00000000",
}

function resolveLoaderDesign(
  designOverride: GlobalLoaderDesign | null | undefined
): ResolvedGlobalLoaderDesign {
  return {
    logoVariant: designOverride?.logoVariant ?? defaultGlobalLoaderDesign.logoVariant,
    frameWidth: designOverride?.frameWidth ?? defaultGlobalLoaderDesign.frameWidth,
    frameHeight: designOverride?.frameHeight ?? defaultGlobalLoaderDesign.frameHeight,
    logoWidth: designOverride?.logoWidth ?? defaultGlobalLoaderDesign.logoWidth,
    logoHeight: designOverride?.logoHeight ?? defaultGlobalLoaderDesign.logoHeight,
    offsetX: designOverride?.offsetX ?? defaultGlobalLoaderDesign.offsetX,
    offsetY: designOverride?.offsetY ?? defaultGlobalLoaderDesign.offsetY,
    logoBackgroundColor:
      designOverride?.logoBackgroundColor ?? defaultGlobalLoaderDesign.logoBackgroundColor,
  }
}

function getCenteredLogoStyle(design: ResolvedGlobalLoaderDesign) {
  return {
    width: `${design.logoWidth}px`,
    height: `${design.logoHeight}px`,
    backgroundColor: design.logoBackgroundColor,
  }
}

function getCenteredLogoWrapperStyle(design: ResolvedGlobalLoaderDesign) {
  return {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    width: `${design.logoWidth}px`,
    height: `${design.logoHeight}px`,
    transform: `translate(-50%, -50%) translate(${design.offsetX}px, ${design.offsetY}px)`,
  }
}

export function GlobalLoader({
  size = "lg",
  fullScreen = true,
  label,
  brandOverride,
  designOverride,
  className,
  ...props
}: GlobalLoaderProps) {
  const { brand } = useRuntimeBrand()
  const [logoFailed, setLogoFailed] = useState(false)
  const loaderDesign = resolveLoaderDesign(designOverride)
  const resolvedBrand = brandOverride ?? brand

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8",
        fullScreen ? "min-h-screen" : "min-h-[40vh] w-full",
        className
      )}
      {...props}
    >
      <div className={cn("relative", sizeClasses[size])}>
        <div
          className="absolute inset-[22%] rounded-full border border-border/70 shadow-sm"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--background) 65%, var(--primary) 35%) 0%, color-mix(in oklab, var(--card) 92%, var(--secondary) 8%) 58%, color-mix(in oklab, var(--card) 84%, var(--accent) 16%) 100%)",
            boxShadow:
              "0 0 0 1px color-mix(in oklab, var(--border) 88%, transparent), 0 24px 48px color-mix(in oklab, var(--primary) 16%, transparent)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, var(--accent) 90deg, transparent 180deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
            opacity: 0.8,
            animationDuration: "3s",
          }}
        />
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--foreground) 90%, var(--primary) 10%) 120deg, color-mix(in oklab, var(--foreground) 48%, transparent) 240deg, transparent 360deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
            opacity: 0.9,
            animationDuration: "2.5s",
          }}
        />
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 180deg, transparent 0deg, color-mix(in oklab, var(--foreground) 58%, transparent) 45deg, transparent 90deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
            opacity: 0.35,
            animationDirection: "reverse",
            animationDuration: "4s",
          }}
        />
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background:
              "conic-gradient(from 270deg, transparent 0deg, color-mix(in oklab, var(--foreground) 38%, transparent) 20deg, transparent 40deg)",
            mask: "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
            opacity: 0.5,
            animationDuration: "3.5s",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {logoFailed ? (
            <div
              className="rounded-full bg-foreground/85 shadow-sm"
              aria-hidden="true"
              style={{
                ...getCenteredLogoWrapperStyle(loaderDesign),
                width: `${Math.max(16, loaderDesign.logoWidth)}px`,
                height: `${Math.max(16, loaderDesign.logoHeight)}px`,
              }}
            />
          ) : (
            <div style={getCenteredLogoWrapperStyle(loaderDesign)}>
              <img
                src={resolveRuntimeBrandLogoUrl(resolvedBrand, loaderDesign.logoVariant)}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
                style={getCenteredLogoStyle(loaderDesign)}
                onError={() => setLogoFailed(true)}
              />
            </div>
          )}
        </div>
      </div>
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  )
}
