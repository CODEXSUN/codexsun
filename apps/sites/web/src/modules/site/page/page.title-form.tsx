import { PageField } from "./page.fields.js";
export function PageTitleForm({
  value,
  onChange
}: {
  value: { label: string; title: string; emphasis: string; intro: string };
  onChange: (value: { label: string; title: string; emphasis: string; intro: string }) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PageField
        label="Section label"
        value={value.label}
        onChange={(label) => onChange({ ...value, label })}
      />
      <PageField
        label="Heading"
        value={value.title}
        onChange={(title) => onChange({ ...value, title })}
      />
      <PageField
        label="Emphasized heading"
        value={value.emphasis}
        onChange={(emphasis) => onChange({ ...value, emphasis })}
      />
      <PageField
        label="Introduction"
        multiline
        value={value.intro}
        onChange={(intro) => onChange({ ...value, intro })}
      />
    </div>
  );
}
