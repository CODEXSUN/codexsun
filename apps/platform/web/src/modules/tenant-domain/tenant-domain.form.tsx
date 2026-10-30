import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormField } from "@codexsun/ui/workspace/upsert";
import { normalizeTenantDomain } from "./tenant-domain.services";

type TenantPrimaryDomainFieldProps = {
  onChange: (value: string) => void;
  value: string;
};

export function TenantPrimaryDomainField({
  onChange,
  value
}: TenantPrimaryDomainFieldProps) {
  return (
    <WorkspaceFormField label="Primary domain (optional)">
      <Input
        className="h-11 rounded-md font-mono"
        value={value}
        onChange={(event) => {
          onChange(normalizeTenantDomain(event.target.value));
        }}
        placeholder="localhost"
      />
    </WorkspaceFormField>
  );
}
