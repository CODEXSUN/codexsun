import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useStorefrontCustomerAuth } from "../auth/customer-auth-context"
import { StorefrontLayout } from "../components/storefront-layout"
import { consumeStorefrontPostAuthRedirect } from "../lib/storefront-auth-redirect"
import { storefrontPaths } from "../lib/storefront-routes"

export function StorefrontAccountRegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const customerAuth = useStorefrontCustomerAuth()
  const [formState, setFormState] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    password: "",
    companyName: "",
    gstin: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const locationState =
    typeof location.state === "object" && location.state
      ? (location.state as { postAuthPath?: string | null })
      : null
  const postAuthPath =
    typeof locationState?.postAuthPath === "string"
      ? locationState.postAuthPath
      : null

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    try {
      await customerAuth.register({
        ...formState,
        companyName: formState.companyName || null,
        gstin: formState.gstin || null,
        addressLine2: formState.addressLine2 || null,
      })
      void navigate(
        postAuthPath ??
          consumeStorefrontPostAuthRedirect() ??
          storefrontPaths.account(),
        { replace: true }
      )
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create customer account."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <StorefrontLayout showCategoryMenu={false}>
      <div className="mx-auto grid min-h-[70vh] w-full max-w-3xl place-items-center px-5 py-10">
        <Card className="w-full rounded-[2rem] border-border/70 py-0 shadow-lg">
          <CardHeader className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Customer registration
            </p>
            <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
              Create your account
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
            {(
              [
                ["displayName", "Full name"],
                ["email", "Email"],
                ["phoneNumber", "Phone number"],
                ["password", "Password"],
                ["companyName", "Company name"],
                ["gstin", "GSTIN"],
                ["addressLine1", "Address line 1"],
                ["addressLine2", "Address line 2"],
                ["city", "City"],
                ["state", "State"],
                ["country", "Country"],
                ["pincode", "Pincode"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className={
                  key === "addressLine1" || key === "addressLine2" ? "md:col-span-2" : ""
                }
              >
                <Label>{label}</Label>
                <Input
                  type={key === "password" ? "password" : "text"}
                  value={formState[key]}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 md:col-span-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to={storefrontPaths.accountLogin()}
                  className="text-foreground underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
              <Button className="rounded-full" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StorefrontLayout>
  )
}
