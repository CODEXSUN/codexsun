import { pageContentSchema } from "@codexsun/sites-api/page-contract";
import { PageField } from "./page.fields.js";
import type { PageContent } from "./page.types.js";
import { Button } from "@codexsun/ui/components/button";
export function PageProfileForm({
  value,
  onChange
}: {
  value: PageContent["profile"];
  onChange: (value: PageContent["profile"]) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PageField
        label="Business name"
        value={value.name}
        onChange={(name) => onChange({ ...value, name })}
      />
      <PageField
        label="Brand wordmark"
        value={value.brand}
        onChange={(brand) => onChange({ ...value, brand })}
      />
      <PageField
        required={false}
        label="Location label"
        value={value.location}
        onChange={(location) => onChange({ ...value, location })}
      />
      <PageField
        label="Tagline"
        value={value.tagline}
        onChange={(tagline) => onChange({ ...value, tagline })}
      />
      <PageField
        invalidMessage={
          pageContentSchema.shape.profile.shape.domain.safeParse(value.domain).success
            ? undefined
            : "Enter a domain without a protocol or path."
        }
        label="Business domain (without https://)"
        value={value.domain}
        onChange={(domain) => onChange({ ...value, domain })}
      />
      <PageField
        required={false}
        label="GSTIN"
        value={value.gstin}
        onChange={(gstin) => onChange({ ...value, gstin })}
      />
      <PageField
        invalidMessage={
          pageContentSchema.shape.profile.shape.emails.safeParse(value.emails).success
            ? undefined
            : "Enter a valid email address on each line."
        }
        required={false}
        label="Email addresses (one per line)"
        multiline
        value={value.emails.join("\n")}
        onChange={(text) =>
          onChange({ ...value, emails: text.split("\n").filter((line) => line.trim()) })
        }
      />
      <PageField
        label="Business address (one line per line)"
        required={false}
        multiline
        value={value.address.join("\n")}
        onChange={(text) =>
          onChange({ ...value, address: text.split("\n").filter((line) => line.trim()) })
        }
      />
      {value.phones.map((phone, index) => (
        <div key={index} className="grid gap-3 rounded-md border p-4">
          <PageField
            label={`Phone ${index + 1} display`}
            value={phone.label}
            onChange={(label) =>
              onChange({
                ...value,
                phones: value.phones.map((p, i) => (i === index ? { ...p, label } : p))
              })
            }
          />
          <Button
            variant="outline"
            onClick={() =>
              onChange({ ...value, phones: value.phones.filter((_, i) => i !== index) })
            }
          >
            Remove phone
          </Button>
          <PageField
            invalidMessage={
              /^\+[0-9]{7,15}$/.test(phone.href)
                ? undefined
                : "Use + followed by the country code and phone digits."
            }
            label="Dial number (+ country code and digits)"
            value={phone.href}
            onChange={(href) =>
              onChange({
                ...value,
                phones: value.phones.map((p, i) => (i === index ? { ...p, href } : p))
              })
            }
          />
        </div>
      ))}
      <Button
        variant="outline"
        disabled={value.phones.length >= 5}
        onClick={() => onChange({ ...value, phones: [...value.phones, { label: "", href: "" }] })}
      >
        Add phone
      </Button>
    </div>
  );
}
