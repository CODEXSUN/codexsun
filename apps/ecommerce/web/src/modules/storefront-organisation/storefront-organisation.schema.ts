import { z } from "zod";
export const storefrontOrganisationSchema = z
  .object({
    displayName: z.string().trim().max(191, "Use no more than 191 characters."),
    logoFileName: z
      .string()
      .regex(/^[a-f0-9]{32}\.png$/u)
      .nullable(),
    companyId: z.number({ error: "Select a company." }).int().positive("Select a company."),
    financialYearId: z
      .number({ error: "Select an accounting year." })
      .int()
      .positive("Select an accounting year.")
  })
  .strict();
