import { AppError } from "@codexsun/framework/errors";

const ALLOWED_ACTOR_EMAIL = "admin@tenant.com";

export async function canViewCrmEnquiryFrappeSync(
  actorEmail: string,
  authorize: () => Promise<void>
) {
  if (actorEmail.trim().toLowerCase() !== ALLOWED_ACTOR_EMAIL) return false;

  try {
    await authorize();
    return true;
  } catch (error) {
    if (error instanceof AppError && error.code === "FORBIDDEN") return false;
    throw error;
  }
}
