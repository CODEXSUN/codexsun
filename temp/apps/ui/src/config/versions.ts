export interface VersionConfig {
  version: string;
  label: string;
  url: string;
  description: string;
  isCurrentVersion?: boolean;
}

export const versions: VersionConfig[] = [
  {
    version: "v4",
    label: "v4",
    url: "https://www.codexsunui-blocks.com",
    description:
      "Latest version built with Tailwind CSS v4 and enhanced components",
    isCurrentVersion: false,
  },
  {
    version: "v3",
    label: "v3",
    url: "https://v3.codexsunui-blocks.com",
    description: "Previous version built with Tailwind CSS v3",
    isCurrentVersion: false,
  },
];
