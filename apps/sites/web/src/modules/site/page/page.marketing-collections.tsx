import { Button } from "@codexsun/ui/components/button";
import { PageField } from "./page.fields.js";
import type { LogicxMarketing } from "@codexsun/sites-api/page-contract";

export function PageMarketingCollections({
  value,
  onChange
}: {
  value: LogicxMarketing;
  onChange: (value: LogicxMarketing) => void;
}) {
  return (
    <>
      <details className="rounded-md border p-4">
        <summary className="cursor-pointer font-semibold">
          Example workflows (demonstrations)
        </summary>
        <div className="mt-4 grid gap-5">
          {value.exampleItems.map((item, index) => (
            <fieldset key={index} className="grid gap-3 border-t pt-3">
              <PageField
                label={`Example ${index + 1} title`}
                value={item.title}
                onChange={(title) =>
                  onChange({
                    ...value,
                    exampleItems: value.exampleItems.map((entry, i) =>
                      i === index ? { ...entry, title } : entry
                    )
                  })
                }
              />
              <PageField
                label={`Example ${index + 1} description`}
                multiline
                value={item.detail}
                onChange={(detail) =>
                  onChange({
                    ...value,
                    exampleItems: value.exampleItems.map((entry, i) =>
                      i === index ? { ...entry, detail } : entry
                    )
                  })
                }
              />
              <PageField
                label={`Example ${index + 1} steps (one per line)`}
                multiline
                value={item.steps.join("\n")}
                onChange={(text) =>
                  onChange({
                    ...value,
                    exampleItems: value.exampleItems.map((entry, i) =>
                      i === index ? { ...entry, steps: lines(text) } : entry
                    )
                  })
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  onChange({
                    ...value,
                    exampleItems: value.exampleItems.filter((_, i) => i !== index)
                  })
                }
              >
                Remove example {index + 1}
              </Button>
            </fieldset>
          ))}
          <Button
            variant="outline"
            disabled={value.exampleItems.length >= 8}
            onClick={() =>
              onChange({
                ...value,
                exampleItems: [
                  ...value.exampleItems,
                  {
                    title: "New example",
                    detail: "Describe this example workflow.",
                    steps: ["First step"]
                  }
                ]
              })
            }
          >
            Add example workflow
          </Button>
        </div>
      </details>
      <details className="rounded-md border p-4">
        <summary className="cursor-pointer font-semibold">Industries</summary>
        <div className="mt-4 grid gap-5">
          {value.industryItems.map((item, index) => (
            <fieldset key={index} className="grid gap-3 border-t pt-3">
              <PageField
                label={`Industry ${index + 1} title`}
                value={item.title}
                onChange={(title) =>
                  onChange({
                    ...value,
                    industryItems: value.industryItems.map((entry, i) =>
                      i === index ? { ...entry, title } : entry
                    )
                  })
                }
              />
              <PageField
                label={`Industry ${index + 1} description`}
                multiline
                value={item.detail}
                onChange={(detail) =>
                  onChange({
                    ...value,
                    industryItems: value.industryItems.map((entry, i) =>
                      i === index ? { ...entry, detail } : entry
                    )
                  })
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  onChange({
                    ...value,
                    industryItems: value.industryItems.filter((_, i) => i !== index)
                  })
                }
              >
                Remove industry {index + 1}
              </Button>
            </fieldset>
          ))}
          <Button
            variant="outline"
            disabled={value.industryItems.length >= 12}
            onClick={() =>
              onChange({
                ...value,
                industryItems: [
                  ...value.industryItems,
                  { title: "New industry", detail: "Describe the workflow needs." }
                ]
              })
            }
          >
            Add industry
          </Button>
        </div>
      </details>
      <details className="rounded-md border p-4">
        <summary className="cursor-pointer font-semibold">Engagement options</summary>
        <div className="mt-4 grid gap-5">
          {value.engagementItems.map((item, index) => {
            const change = (patch: Partial<typeof item>) =>
              onChange({
                ...value,
                engagementItems: value.engagementItems.map((entry, i) =>
                  i === index ? { ...entry, ...patch } : entry
                )
              });
            return (
              <fieldset key={index} className="grid gap-3 border-t pt-3">
                <PageField
                  label={`Option ${index + 1} label`}
                  value={item.label}
                  onChange={(label) => change({ label })}
                />
                <PageField
                  label={`Option ${index + 1} title`}
                  value={item.title}
                  onChange={(title) => change({ title })}
                />
                <PageField
                  label={`Option ${index + 1} description`}
                  multiline
                  value={item.detail}
                  onChange={(detail) => change({ detail })}
                />
                <PageField
                  label={`Option ${index + 1} inclusions (one per line)`}
                  multiline
                  value={item.items.join("\n")}
                  onChange={(text) => change({ items: lines(text) })}
                />
                <PageField
                  label={`Option ${index + 1} enquiry topic`}
                  value={item.topic}
                  onChange={(topic) => change({ topic })}
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    onChange({
                      ...value,
                      engagementItems: value.engagementItems.filter((_, i) => i !== index)
                    })
                  }
                >
                  Remove option {index + 1}
                </Button>
              </fieldset>
            );
          })}
          <Button
            variant="outline"
            disabled={value.engagementItems.length >= 6}
            onClick={() =>
              onChange({
                ...value,
                engagementItems: [
                  ...value.engagementItems,
                  {
                    label: "New option",
                    title: "New engagement",
                    detail: "Describe this engagement.",
                    items: ["Scope review"],
                    topic: "Project consultation"
                  }
                ]
              })
            }
          >
            Add engagement option
          </Button>
        </div>
      </details>
      <details className="rounded-md border p-4">
        <summary className="cursor-pointer font-semibold">Frequently asked questions</summary>
        <div className="mt-4 grid gap-5">
          {value.questions.map((item, index) => (
            <fieldset key={index} className="grid gap-3 border-t pt-3">
              <PageField
                label={`Question ${index + 1}`}
                value={item.title}
                onChange={(title) =>
                  onChange({
                    ...value,
                    questions: value.questions.map((entry, i) =>
                      i === index ? { ...entry, title } : entry
                    )
                  })
                }
              />
              <PageField
                label={`Answer ${index + 1}`}
                multiline
                value={item.answer}
                onChange={(answer) =>
                  onChange({
                    ...value,
                    questions: value.questions.map((entry, i) =>
                      i === index ? { ...entry, answer } : entry
                    )
                  })
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  onChange({ ...value, questions: value.questions.filter((_, i) => i !== index) })
                }
              >
                Remove question {index + 1}
              </Button>
            </fieldset>
          ))}
          <Button
            variant="outline"
            disabled={value.questions.length >= 20}
            onClick={() =>
              onChange({
                ...value,
                questions: [
                  ...value.questions,
                  { title: "New question", answer: "Add the answer." }
                ]
              })
            }
          >
            Add question
          </Button>
        </div>
      </details>
    </>
  );
}

function lines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
