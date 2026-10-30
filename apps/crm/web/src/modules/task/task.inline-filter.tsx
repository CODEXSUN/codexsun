import { useRef, type KeyboardEvent } from "react";
import { Input } from "@codexsun/ui/components/input";

export function TaskInlineFilter({
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
  const step = useRef(0);
  function escape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    step.current += 1;
    if (step.current === 1) event.currentTarget.select();
    else if (step.current === 2) onChange("");
    else {
      step.current = 0;
      onHide();
    }
  }
  return (
    <Input
      aria-label={`Filter ${label}`}
      className="h-7 min-w-0 rounded-sm border-border/80 bg-white px-2 text-xs shadow-none"
      maxLength={191}
      value={value}
      onChange={(event) => {
        step.current = 0;
        onChange(event.target.value);
      }}
      onKeyDown={escape}
    />
  );
}
