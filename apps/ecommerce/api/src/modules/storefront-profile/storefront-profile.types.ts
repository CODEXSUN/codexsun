export type StorefrontProfile = {
  aboutUs: string;
  copyrightText: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  paymentMethods: StorefrontPaymentMethod[];
  poweredByText: string;
  serviceActionLabel: string;
  serviceActionUrl: string;
  serviceDescription: string;
  serviceEyebrow: string;
  serviceTitle: string;
  tagline: string;
  trustedDescription: string;
  trustedEyebrow: string;
  trustedProofPoints: string;
  trustedTitle: string;
  threadsUrl: string;
  whatsappUrl: string;
  xUrl: string;
  youtubeUrl: string;
};

export type StorefrontProfileInput = StorefrontProfile;

export type StorefrontPaymentMethod = {
  logoUrl: string;
  name: string;
};
