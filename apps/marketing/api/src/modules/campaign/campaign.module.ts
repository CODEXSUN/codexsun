import { registerCampaignRoutes } from "./campaign.routes.js";
export const campaignModule = {
  key: "marketing.campaign",
  capabilities: { events: false, worker: false, sync: false },
  register: registerCampaignRoutes
};
