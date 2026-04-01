export const config = {
  appUrl:
    process.env.NODE_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ??
        process.env.NEXT_PUBLIC_APP_URL!)
      : "localhost:3000",
  social: {
    github: "https://github.com/akash3444/codexsun-ui-blocks",
    twitter: "https://twitter.com/codexsunui_blocks",
  },
};
