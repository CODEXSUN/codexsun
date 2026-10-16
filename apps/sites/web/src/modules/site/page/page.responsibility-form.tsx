import { Button } from "@codexsun/ui/components/button";
import { PageField } from "./page.fields.js";
import { PageTitleForm } from "./page.title-form.js";
import type { PageContent } from "./page.types.js";
export function PageResponsibilityForm({
  value,
  onChange
}: {
  value: PageContent;
  onChange: (value: PageContent) => void;
}) {
  return (
    <>
      <PageTitleForm
        value={value.responsibility}
        onChange={(title) =>
          onChange({ ...value, responsibility: { ...value.responsibility, ...title } })
        }
      />
      <PageField
        label="Profile link label"
        value={value.responsibility.linkLabel}
        onChange={(linkLabel) =>
          onChange({ ...value, responsibility: { ...value.responsibility, linkLabel } })
        }
      />
      <PageField
        label="Profile note"
        multiline
        value={value.responsibility.note}
        onChange={(note) =>
          onChange({ ...value, responsibility: { ...value.responsibility, note } })
        }
      />
      {value.responsibility.items.map((item, index) => (
        <fieldset key={index} className="grid gap-3 rounded-md border p-4">
          <legend className="px-2">Commitment {index + 1}</legend>
          <PageField
            label="Commitment title"
            value={item.title}
            onChange={(title) =>
              onChange({
                ...value,
                responsibility: {
                  ...value.responsibility,
                  items: value.responsibility.items.map((f, i) =>
                    i === index ? { ...f, title } : f
                  )
                }
              })
            }
          />
          <PageField
            label="Commitment description"
            multiline
            value={item.body}
            onChange={(body) =>
              onChange({
                ...value,
                responsibility: {
                  ...value.responsibility,
                  items: value.responsibility.items.map((f, i) =>
                    i === index ? { ...f, body } : f
                  )
                }
              })
            }
          />
          <Button
            variant="outline"
            onClick={() =>
              onChange({
                ...value,
                responsibility: {
                  ...value.responsibility,
                  items: value.responsibility.items.filter((_, i) => i !== index)
                }
              })
            }
          >
            Remove commitment
          </Button>
        </fieldset>
      ))}
      <Button
        variant="outline"
        disabled={value.responsibility.items.length >= 12}
        onClick={() =>
          onChange({
            ...value,
            responsibility: {
              ...value.responsibility,
              items: [...value.responsibility.items, { title: "", body: "" }]
            }
          })
        }
      >
        Add commitment
      </Button>
    </>
  );
}
