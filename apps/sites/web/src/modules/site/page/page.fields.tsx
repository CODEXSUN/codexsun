import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { createContext, useContext } from "react";
export const PageValidationContext = createContext(false);
export function PageField({
  label,
  value,
  onChange,
  multiline = false,
  required = true,
  invalidMessage
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  invalidMessage?: string | undefined;
}) {
  const showValidation = useContext(PageValidationContext);
  const problem = invalidMessage || (required && !value.trim() ? `${label} is required.` : "");
  const invalid = Boolean(showValidation && problem);
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </span>
      {multiline ? (
        <Textarea
          aria-invalid={invalid}
          className={invalid ? "border-destructive" : ""}
          value={value}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          aria-invalid={invalid}
          className={invalid ? "border-destructive" : ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {invalid ? <span className="text-xs text-destructive">{problem}</span> : null}
    </label>
  );
}
