export type SpecialDefinition = { prefix: string; name: string; isEnabled: boolean };
export type SpecialSettings = {
  revision: number;
  enabled: boolean;
  selectedPrefix: string;
  definitions: SpecialDefinition[];
};
