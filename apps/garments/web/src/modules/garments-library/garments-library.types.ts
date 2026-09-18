import type { Document, DocumentSummary } from "@codexsun/garments-contracts";

export type GarmentsState = {
  activeDocument?: Document;
  documents: DocumentSummary[];
  error?: string;
  loading: boolean;
};
