import { useState } from "react";
import { designSystemVariants } from "@codexsun/ui/design-system";
import {
  getAppearanceMode,
  getDesignVariantId,
  setAppearanceMode,
  setDesignVariantId,
  type AppearanceMode
} from "../../app/design-system";
export function QCafeAppearance() {
  const [mode, updateMode] = useState(getAppearanceMode);
  const [variant, updateVariant] = useState(getDesignVariantId);
  return (
    <div>
      <fieldset>
        <legend>Appearance mode</legend>
        <div className="my-3 flex gap-2">
          {(["system", "light", "dark"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={mode === value}
              className={`rounded border px-4 py-2 text-sm ${mode === value ? "bg-muted font-semibold" : ""}`}
              onClick={() => {
                setAppearanceMode(value as AppearanceMode);
                updateMode(value);
              }}
            >
              {value === "system"
                ? "System default"
                : value === "light"
                  ? "Light theme"
                  : "Dark theme"}
            </button>
          ))}
        </div>
      </fieldset>
      <h3 className="mb-3 text-sm font-semibold">Design theme</h3>
      <div className="grid grid-cols-2 gap-2">
        {designSystemVariants.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={variant === item.id}
            className={`flex items-center gap-2 rounded border p-3 text-left text-sm ${variant === item.id ? "bg-muted font-semibold" : ""}`}
            onClick={() => {
              setDesignVariantId(item.id);
              updateVariant(item.id);
            }}
          >
            <span className="flex">
              {item.palette.map((color, index) => (
                <span
                  key={index}
                  className="size-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
