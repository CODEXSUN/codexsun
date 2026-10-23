export type LeadRecord = {
  uuid: string;
  companyId: number;
  submissionUuid: string;
  campaignUuid: string;
  campaignLabel: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  assignedTo: string;
  status: "review";
  taskId: number | null;
};
