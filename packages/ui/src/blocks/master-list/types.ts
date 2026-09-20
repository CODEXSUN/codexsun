import type { ReactNode } from 'react';

export type MasterValue = string | number | boolean | null | undefined;

export type MasterRecord = { id: string } & Record<string, MasterValue>;

export type MasterField = {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'textarea' | 'select';
  options?: readonly { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  showInList?: boolean;
  format?: (value: MasterValue, record: MasterRecord) => ReactNode;
};

export type MasterFormValues = Record<string, string>;
