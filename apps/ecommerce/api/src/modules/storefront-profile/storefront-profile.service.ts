import { AppError } from "@codexsun/framework/errors";
import { StorefrontProfileRepository } from "./storefront-profile.repository.js";
import { invalidateStorefrontReadCache } from "../storefront/index.js";
import type { StorefrontProfileInput } from "./storefront-profile.types.js";

export class StorefrontProfileService {
  constructor(private readonly repository = new StorefrontProfileRepository()) {}

  async get() {
    return (await this.repository.get()) ?? emptyStorefrontProfile();
  }

  async save(input: StorefrontProfileInput, actorEmail: string) {
    const profile = normalize(input);
    const saved = await this.repository.save(profile, actorEmail.trim() || "system:application");
    if (!saved)
      throw new AppError({
        code: "STOREFRONT_PROFILE_SAVE_FAILED",
        message: "The storefront profile could not be saved.",
        statusCode: 500
      });
    invalidateStorefrontReadCache();
    return saved;
  }
}

export function emptyStorefrontProfile(): StorefrontProfileInput {
  return {
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
}

function normalize(input: StorefrontProfileInput): StorefrontProfileInput {
  return {
    ...Object.fromEntries(
      Object.entries(input)
        .filter(([key]) => key !== "paymentMethods")
        .map(([key, value]) => [key, String(value).trim()])
    ),
    paymentMethods: input.paymentMethods.map((method) => ({
      logoUrl: method.logoUrl.trim(),
      name: method.name.trim()
    }))
  } as StorefrontProfileInput;
}
