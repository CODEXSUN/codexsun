import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { config } from "dotenv";
import { resolve } from "node:path";

type CodeitzConfiguration = ReturnType<typeof readLocalIdentityConfiguration> & {
  readonly apiReferenceToken: string;
  readonly host: string;
  readonly port: number;
};

export function readConfig(): CodeitzConfiguration {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.CODEITZ_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set CODEITZ_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.CODEITZ_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set CODEITZ_API_REFERENCE_TOKEN.");
  return {
    apiReferenceToken,
    host,
    port,
    ...readLocalIdentityConfiguration(process.env, {
      applicationId: "codeitz",
      databasePath: resolve(process.cwd(), "../../../storage/apps/codeitz/private/data/codeitz_db.sqlite"),
    }),
  };
}
