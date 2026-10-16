import type { Generated } from "kysely";
export type DeviceInput = { deviceKey: string; label: string; kind: "web" | "desktop" | "mobile" };
export type DeviceRecord = DeviceInput & {
  uuid: string;
  lastSeenAt: string;
  status: "active" | "inactive";
  createdBy: string;
};
export type DeviceRow = {
  id: Generated<number>;
  uuid: string;
  device_key: string;
  label: string;
  kind: DeviceInput["kind"];
  last_seen_at: string;
  status: DeviceRecord["status"];
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type DevicesDatabase = {
  codexsun_devices: DeviceRow;
  codexsun_device_activity: {
    id: Generated<number>;
    uuid: string;
    device_uuid: string;
    action: string;
    actor_email: string;
    status: Generated<"active" | "inactive">;
    created_by: Generated<string>;
    updated_at: Generated<string>;
    created_at: string;
  };
};
