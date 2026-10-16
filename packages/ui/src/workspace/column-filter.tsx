import { useRef, type KeyboardEvent } from "react";
import { Input } from "../components/input";

export function WorkspaceColumnFilter({
  label,
  value,
  onChange,
  onHide
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onHide: () => void;
}) {
  const escapeStep = useRef(0);
  const handleEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    escapeStep.current += 1;
    if (escapeStep.current === 1) event.currentTarget.select();
    else if (escapeStep.current === 2) onChange("");
    else {
      escapeStep.current = 0;
      onHide();
    }
  };
  return (
    <Input
      aria-label={`Filter ${label}`}
      className="h-7 min-w-0 rounded-sm border-border/80 bg-white px-2 text-xs shadow-none"
      maxLength={191}
      value={value}
      onChange={(event) => {
        escapeStep.current = 0;
        onChange(event.target.value);
      }}
      onKeyDown={handleEscape}
    />
  );
}
