import type { Kysely } from "kysely";
import type { EnquiryInput, EnquiryRecord } from "@codexsun/crm-api/enquiry-sync";
import type { FrappeDatabase } from "../connection/index.js";

export type RemoteEnquiry = {
  name: string;
  owner?: string | null;
  creation?: string | null;
  title?: string | null;
  enquiry_details?: string | null;
  mobile?: string | null;
  customer?: string | null;
  date?: string | null;
  due_date?: string | null;
  priority?: string | null;
  status?: string | null;
  status_details?: string | null;
  modified?: string | null;
  user_employee?: string | null;
  assigned_to_employee?: string | null;
  group?: string | null;
  mobile_customer?: string | null;
  company_name?: string | null;
  address?: string | null;
};

export type RemoteEnquiryComment = {
  name: string;
  content?: string | null;
  owner?: string | null;
  creation?: string | null;
  comment_type?: string | null;
};

export type ImportProgress = {
  scanned: number;
  created: number;
  skipped: number;
  failed: number;
  failures: { name: string; message: string }[];
};

export type EnquirySyncContext = {
  database: Kysely<FrappeDatabase>;
  createEnquiry: (input: EnquiryInput) => Promise<EnquiryRecord>;
  createImportedEnquiry?: (
    input: EnquiryInput,
    source: {
      enquiryNo: number;
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      externalCustomer?: { externalKey: string; code: string; name: string; mobile: string };
    }
  ) => Promise<EnquiryRecord>;
  updateImportedEnquiry?: (
    id: number,
    input: EnquiryInput,
    source: {
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      externalCustomer?: { externalKey: string; code: string; name: string; mobile: string };
    }
  ) => Promise<EnquiryRecord>;
  localActorForFrappeUser?: (remoteUser: string, baseUrl: string) => Promise<string | null>;
  localActorForEmployee?: (employeeCode: string, baseUrl: string) => Promise<string | null>;
  importComment?: (
    enquiryId: number,
    comment: {
      id: string;
      content: string;
      author: string;
      createdAt: string;
      parentSourceId?: string | null;
      parentLocalId?: number;
    }
  ) => Promise<void>;
  linkCustomerIdentity?: (
    sourceKey: string,
    remoteName: string,
    localContactId: number
  ) => Promise<void>;
  updateEnquiry: (id: number, input: EnquiryInput) => Promise<EnquiryRecord>;
  localUserForEmployee: (employeeCode: string, baseUrl: string) => Promise<number | null>;
  listInForName: (name: string) => Promise<number | null>;
};
