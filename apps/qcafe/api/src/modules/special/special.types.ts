export type SpecialDefinition = { prefix: string; name: string; isEnabled: boolean };
export type SpecialSettings = {
  revision: number;
  enabled: boolean;
  selectedPrefix: string;
  definitions: SpecialDefinition[];
};
export const emptySpecialSettings: SpecialSettings = {
  revision: 0,
  enabled: false,
  selectedPrefix: "",
  definitions: []
};
