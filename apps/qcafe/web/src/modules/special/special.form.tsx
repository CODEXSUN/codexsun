import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { specialDefinitionSchema } from "./special.schema";
import type { SpecialDefinition } from "./special.types";
export function SpecialForm({
  disabled,
  onAdd
}: {
  disabled: boolean;
  onAdd: (input: SpecialDefinition) => void;
}) {
  const [prefix, setPrefix] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  function add(event: React.FormEvent) {
    event.preventDefault();
    const parsed = specialDefinitionSchema.safeParse({ prefix, name, isEnabled: true });
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    onAdd(parsed.data);
    setPrefix("");
    setName("");
    setError("");
  }
  return (
    <form onSubmit={add} className="qcafe-special-add">
      <label>
        Prefix
        <Input
          aria-label="New special prefix"
          placeholder="SS"
          value={prefix}
          disabled={disabled}
          onChange={(event) => setPrefix(event.target.value.toUpperCase())}
        />
      </label>
      <label>
        Special name
        <Input
          aria-label="New special name"
          placeholder="Sunday Special"
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <Button disabled={disabled}>Add special</Button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
