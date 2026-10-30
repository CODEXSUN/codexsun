import { Button } from "@codexsun/ui/components/button";
import { PageField } from "./page.fields.js";
import type { PageContent } from "./page.types.js";
export function PageProcessingForm({
  value,
  onChange
}: {
  value: PageContent["processing"];
  onChange: (value: PageContent["processing"]) => void;
}) {
  return (
    <div className="grid gap-4">
      <PageField
        label="Foundation label"
        value={value.foundationLabel}
        onChange={(foundationLabel) => onChange({ ...value, foundationLabel })}
      />
      <PageField
        label="Foundation processes (one per line)"
        multiline
        value={value.foundation.join("\n")}
        onChange={(text) => onChange({ ...value, foundation: text.split("\n") })}
      />
      {value.lines.map((line, index) => (
        <fieldset key={index} className="grid gap-4 rounded-md border p-4">
          <legend className="px-2 font-medium">Processing route {index + 1}</legend>
          <PageField
            label="Route title"
            value={line.title}
            onChange={(title) =>
              onChange({
                ...value,
                lines: value.lines.map((item, i) => (i === index ? { ...item, title } : item))
              })
            }
          />
          <PageField
            label="Route description"
            multiline
            value={line.description}
            onChange={(description) =>
              onChange({
                ...value,
                lines: value.lines.map((item, i) => (i === index ? { ...item, description } : item))
              })
            }
          />
          {line.stages.map(([stage, equipment], stageIndex) => (
            <div key={stageIndex} className="grid gap-3 sm:grid-cols-2">
              <PageField
                label="Stage"
                value={stage}
                onChange={(text) =>
                  onChange({
                    ...value,
                    lines: value.lines.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            stages: item.stages.map((pair, j) =>
                              j === stageIndex ? [text, pair[1]] : pair
                            )
                          }
                        : item
                    )
                  })
                }
              />
              <PageField
                label="Equipment & origin"
                value={equipment}
                onChange={(text) =>
                  onChange({
                    ...value,
                    lines: value.lines.map((item, i) =>
                      i === index
                        ? {
                            ...item,
                            stages: item.stages.map((pair, j) =>
                              j === stageIndex ? [pair[0], text] : pair
                            )
                          }
                        : item
                    )
                  })
                }
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...value,
                lines: value.lines.map((item, i) =>
                  i === index
                    ? { ...item, stages: [...item.stages, ["New stage", "Equipment"]] }
                    : item
                )
              })
            }
          >
            Add stage
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={value.lines.length < 2}
            onClick={() => onChange({ ...value, lines: value.lines.filter((_, i) => i !== index) })}
          >
            Remove route
          </Button>
        </fieldset>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          onChange({
            ...value,
            lines: [
              ...value.lines,
              {
                title: "New route",
                description: "Describe this processing route.",
                stages: [["Processing", "Equipment"]]
              }
            ]
          })
        }
      >
        Add processing route
      </Button>
    </div>
  );
}
