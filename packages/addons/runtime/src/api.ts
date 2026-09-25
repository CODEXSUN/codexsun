export type AddonHttpMethod = "GET" | "POST" | "PATCH";

export interface AddonApiRoute {
  readonly method: AddonHttpMethod;
  readonly path: string;
  readonly contract: string;
  readonly permission: string;
}

export function defineAddonRoutes(id: string): readonly AddonApiRoute[] {
  return [
    { method: "GET", path: `/api/v1/${id}/records`, contract: `${id}.v1`, permission: `${id}.read` },
    { method: "POST", path: `/api/v1/${id}/records`, contract: `${id}.v1`, permission: `${id}.write` },
    { method: "PATCH", path: `/api/v1/${id}/records/:recordId`, contract: `${id}.v1`, permission: `${id}.write` },
  ];
}
