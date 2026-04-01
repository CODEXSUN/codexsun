export const getInstallationCommand = (
  packageManager: string,
  registryUrl: string
) => {
  switch (packageManager) {
    case "npm":
    case "yarn":
      return `npx codexsun@latest add ${registryUrl}`;
    case "pnpm":
      return `pnpm dlx codexsun@latest add ${registryUrl}`;
    case "bun":
      return `bunx --bun codexsun@latest add ${registryUrl}`;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }
};
