import { Button } from "@codexsun/ui/components/button";
import { PageField } from "./page.fields.js";
import { PageTitleForm } from "./page.title-form.js";
import type { PageContent } from "./page.types.js";
export function PageFinishesForm({
  value,
  onChange
}: {
  value: PageContent;
  onChange: (value: PageContent) => void;
}) {
  return (
    <>
      <PageTitleForm
        value={value.finishes}
        onChange={(title) => onChange({ ...value, finishes: { ...value.finishes, ...title } })}
      />
      {value.finishes.items.map((item, index) => (
        <fieldset key={index} className="grid gap-3 rounded-md border p-4">
          <legend className="px-2">Service / finish {index + 1}</legend>
          <PageField
            label="Service / finish name"
            value={item.name}
            onChange={(name) =>
              onChange({
                ...value,
                finishes: {
                  ...value.finishes,
                  items: value.finishes.items.map((f, i) => (i === index ? { ...f, name } : f))
                }
              })
            }
          />
          <PageField
            label="Description"
            multiline
            value={item.detail}
            onChange={(detail) =>
              onChange({
                ...value,
                finishes: {
                  ...value.finishes,
                  items: value.finishes.items.map((f, i) => (i === index ? { ...f, detail } : f))
                }
              })
            }
          />
          <Button
            variant="outline"
            size="sm"
            disabled={false}
            onClick={() =>
              onChange({
                ...value,
                finishes: {
                  ...value.finishes,
                  items: value.finishes.items.filter((_, i) => i !== index)
                }
              })
            }
          >
            Remove service / finish
          </Button>
        </fieldset>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          onChange({
            ...value,
            finishes: {
              ...value.finishes,
              items: [...value.finishes.items, { name: "", detail: "" }]
            }
          })
        }
      >
        Add service / finish
      </Button>
    </>
  );
}
