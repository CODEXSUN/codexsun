import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { toast } from "sonner";
import { StorefrontProfileForm } from "./storefront-profile.form";
import { useStorefrontProfile } from "./storefront-profile.hooks";
import { storefrontProfileSchema } from "./storefront-profile.schema";
import type { StorefrontProfile } from "./storefront-profile.types";

const empty: StorefrontProfile = {
  aboutUs: "",
  copyrightText: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  paymentMethods: [
    { logoUrl: "", name: "VISA" },
    { logoUrl: "", name: "Mastercard" },
    { logoUrl: "", name: "UPI" },
    { logoUrl: "", name: "G Pay" }
  ],
  poweredByText: "",
  serviceActionLabel: "Get support",
  serviceActionUrl: "/support",
  serviceDescription:
    "Local help for products, installation, maintenance, and ongoing technology needs.",
  serviceEyebrow: "Tech Media care",
  serviceTitle: "Technology works better with support close by.",
  tagline: "",
  trustedDescription:
    "We help you choose technology that fits the work, set it up properly, and keep it useful as your needs grow.",
  trustedEyebrow: "Trusted in Tiruppur since 2002",
  trustedProofPoints:
    "Multi-brand guidance\nLocal technical support\nRetail and business expertise",
  trustedTitle: "25+ years of practical technology experience",
  threadsUrl: "",
  whatsappUrl: "",
  xUrl: "",
  youtubeUrl: ""
};

export function StorefrontProfileWorkspace({
  mode = "profile"
}: {
  mode?: "profile" | "service-banner" | "trusted-strip";
}) {
  const { profile, save } = useStorefrontProfile();
  const [value, setValue] = useState(empty);
  const [darkPreview, setDarkPreview] = useState(true);
  useEffect(() => {
    if (profile.data) setValue(profile.data);
  }, [profile.data]);
  function submit() {
    const parsed = storefrontProfileSchema.safeParse(value);
    if (!parsed.success)
      return toast.error(parsed.error.issues[0]?.message ?? "Check the storefront profile.");
    save.mutate(parsed.data, {
      onError: (error) => toast.error(error.message),
      onSuccess: () => toast.success("Storefront profile saved.")
    });
  }
  return (
    <WorkspacePage title={workspaceCopy[mode].title} description={workspaceCopy[mode].description}>
      <div className="grid gap-5">
        <Card title={workspaceCopy[mode].cardTitle}>
          <StorefrontProfileForm mode={mode} onChange={setValue} value={value} />
        </Card>
        {mode === "profile" ? (
          <Card title="Footer preview">
            <FooterPreview dark={darkPreview} profile={value} />
          </Card>
        ) : null}
        <div className="flex justify-end">
          <Button disabled={profile.isLoading || save.isPending} onClick={submit}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
      {mode === "profile" ? (
        <div
          className="fixed bottom-5 right-5 z-30 flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm"
          aria-label="Preview tone"
        >
          <Button
            onClick={() => setDarkPreview(false)}
            size="sm"
            variant={darkPreview ? "ghost" : "default"}
          >
            Light
          </Button>
          <Button
            onClick={() => setDarkPreview(true)}
            size="sm"
            variant={darkPreview ? "default" : "ghost"}
          >
            Dark
          </Button>
        </div>
      ) : null}
    </WorkspacePage>
  );
}

const workspaceCopy = {
  profile: {
    cardTitle: "Profile and footer",
    description:
      "Set the white-label message and footer details shown with the Application Company brand.",
    title: "Storefront Profile"
  },
  "trusted-strip": {
    cardTitle: "Trusted strip content",
    description: "Edit the experience statement and proof points shown below the home slider.",
    title: "Trusted Strip"
  },
  "service-banner": {
    cardTitle: "Service banner content",
    description: "Edit the support callout shown near the end of the storefront home page.",
    title: "Service Banner"
  }
} as const;

function FooterPreview({ dark, profile }: { dark: boolean; profile: StorefrontProfile }) {
  return (
    <div
      className={`grid gap-3 rounded-md p-6 ${dark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-950"}`}
    >
      <strong>Application Company</strong>
      <span>{profile.tagline || "Your company tagline"}</span>
      <p className="max-w-2xl text-sm opacity-80">
        {profile.aboutUs || "Your About Us text will appear here."}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <strong>Supported payment types</strong>
        {profile.paymentMethods.map((method) => (
          <span
            className="flex h-9 items-center gap-2 rounded bg-white px-2 text-slate-950"
            key={`${method.name}:${method.logoUrl}`}
          >
            {method.logoUrl ? (
              <img
                alt=""
                aria-hidden="true"
                className="h-5 w-auto max-w-14 object-contain"
                src={method.logoUrl}
              />
            ) : null}
            {method.name || "Payment type"}
          </span>
        ))}
      </div>
      <div className="flex justify-between gap-4 border-t border-current/20 pt-3 text-sm">
        <span>{profile.copyrightText || "Copyright instructions"}</span>
        <span>{profile.poweredByText}</span>
      </div>
    </div>
  );
}
