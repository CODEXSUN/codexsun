import { useState, type HTMLAttributes } from "react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"

import {
  storefrontSettingsSchema,
  storefrontSettingsWorkflowStatusSchema,
  type StorefrontMenuSurfaceDesign,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { resolveRuntimeBrandLogoUrl } from "@/features/branding/runtime-brand-logo"
import { cn } from "@/lib/utils"

type LoaderSize = "sm" | "md" | "lg"

type GlobalLoaderProps = HTMLAttributes<HTMLDivElement> & {
  size?: LoaderSize
  fullScreen?: boolean
  label?: string
  brandOverride?: {
    darkLogoUrl?: string | null
    logoUrl?: string | null
  } | null
  designOverride?: StorefrontMenuSurfaceDesign | null
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: "size-30",
  md: "size-42",
  lg: "size-60",
}

const defaultGlobalLoaderDesign: StorefrontMenuSurfaceDesign = {
  logoVariant: "primary",
  frameWidth: 88,
  frameHeight: 88,
  logoWidth: 40,
  logoHeight: 40,
  offsetX: 0,
  offsetY: 0,
  logoHoverColor: "#8b5e34",
  areaBackgroundColor: "#ffffff",
  logoBackgroundColor: "#00000000",
}

function getCenteredLogoStyle(design: StorefrontMenuSurfaceDesign) {
  return {
    width: `${design.logoWidth}px`,
    height: `${design.logoHeight}px`,
    backgroundColor: design.logoBackgroundColor,
  }
}

function getCenteredLogoWrapperStyle(design: StorefrontMenuSurfaceDesign) {
  return {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    width: `${design.logoWidth}px`,
    height: `${design.logoHeight}px`,
    transform: `translate(-50%, -50%) translate(${design.offsetX}px, ${design.offsetY}px)`,
  }
}

function useGlobalLoaderMenuDesign() {
  const query = useQuery({
    queryKey: ["storefront", "menu-designer", "global-loader"],
    queryFn: async () => {
      const accessToken = getStoredAccessToken()

      if (accessToken) {
        const workflowResponse = await fetch("/internal/v1/ecommerce/storefront-settings/workflow", {
          cache: "no-store",
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        })

        if (workflowResponse.ok) {
          const workflowPayload = storefrontSettingsWorkflowStatusSchema.parse(
            await workflowResponse.json()
          )
          return workflowPayload.previewSettings.menuDesigner.globalLoader
        }
      }

      const response = await fetch("/public/v1/storefront/settings", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`)
      }

      const payload = storefrontSettingsSchema.parse(await response.json())
      return payload.menuDesigner.globalLoader
    },
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  })

  return query.data ?? defaultGlobalLoaderDesign
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
  const runtimeLoaderDesign = useGlobalLoaderMenuDesign()
  const loaderDesign = designOverride ?? runtimeLoaderDesign
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
      </motion.div>
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : null}
    </div>
  )
}
