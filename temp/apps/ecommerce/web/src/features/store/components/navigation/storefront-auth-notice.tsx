import { Link } from "react-router-dom"

import { buttonVariants } from "@/components/ui/button"

export function StorefrontAuthNotice({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-4xl border border-border/60 bg-card p-8 text-center shadow-[0_24px_60px_-38px_rgba(40,28,18,0.22)]">
      <div className="text-2xl font-semibold">{title}</div>
      <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/login" className={buttonVariants({ className: "rounded-full px-5" })}>Sign In</Link>
        <Link to="/" className={buttonVariants({ variant: "outline", className: "rounded-full px-5" })}>Back to Home</Link>
      </div>
    </div>
  )
}
