import { z } from "zod";
export const reportBodySchema = z.string().trim().min(1,"Enter the actions taken.").max(10000);
