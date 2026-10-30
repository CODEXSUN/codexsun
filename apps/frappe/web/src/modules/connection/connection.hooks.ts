import { useQuery } from "@tanstack/react-query";
import { getFrappeConnection, getFrappeDataSource } from "./connection.services";

export const frappeConnectionKey = ["frappe", "connection"] as const;
export const frappeDataSourceKey = ["frappe", "data-source", "crm.enquiries"] as const;

export function useFrappeDataSource() {
  return useQuery({ queryKey: frappeDataSourceKey, queryFn: getFrappeDataSource });
}

export function useFrappeConnectionSettings() {
  return useQuery({ queryKey: frappeConnectionKey, queryFn: getFrappeConnection });
}
