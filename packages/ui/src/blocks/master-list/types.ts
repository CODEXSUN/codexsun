import type { ReactNode } from 'react';

export type MasterValue = string | number | boolean | null | undefined;

export type MasterRecord = { id: string } & Record<string, MasterValue>;

export type MasterField = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'textarea' | 'select' | undefined;
  options?: readonly { label: string; value: string }[];
  placeholder?: string | undefined;
  required?: boolean | undefined;
  showInList?: boolean | undefined;
  format?: ((value: MasterValue, record: MasterRecord) => ReactNode) | undefined;
};

export type MasterFormValues = Record<string, string>;
