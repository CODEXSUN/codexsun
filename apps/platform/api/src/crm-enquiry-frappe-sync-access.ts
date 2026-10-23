import { AppError } from "@codexsun/framework/errors";

export async function canViewCrmEnquiryFrappeSync(authorize: () => Promise<void>) {
  try {
    await authorize();
    return true;
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") return false;
    throw error;
  }
}
