import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "mailer",
  "label": "Mailer",
  "purpose": "Business email, inboxes, threads, templates, sending, and email automation",
  "areas": [
    "email",
    "inboxes",
    "automation"
  ],
  "contracts": [
    "mailer.v1"
  ],
  "publishedEvents": [
    "mailer.email.sent",
    "mailer.email.failed"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class MailerService extends AddonService {
  constructor() {
    super(definition);
  }

  sendEmail(input: { to: readonly string[]; subject: string; templateId?: string }) {
    return { ...this.create({ title: input.subject, ownerId: "system", metadata: { to: input.to.join(","), templateId: input.templateId ?? "" } }), to: input.to, subject: input.subject };
  }
}

export function createMailerService() {
  return new MailerService();
}
