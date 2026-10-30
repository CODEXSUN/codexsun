import { initialSitePage } from "@codexsun/sites-api/page-defaults";
import type { PageContent, TextileContent } from "@codexsun/sites-api/page-contract";
import { PageField } from "./page.fields.js";
const defaults = initialSitePage({
  id: 0,
  uuid: "e303865e",
  slug: "tirupurconnect",
  name: "Tirupur Connect",
  status: "active"
}).textile!;
export function PageTextileForm({
  value,
  onChange
}: {
  value: PageContent;
  onChange: (value: PageContent) => void;
}) {
  const textile = value.textile ?? defaults;
  const update = (patch: Partial<TextileContent>) =>
    onChange({ ...value, textile: { ...textile, ...patch } });
  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">
        Manage Tirupur Connect’s public presentation. Use Client details for contacts, Hero for the
        main heading, and Footer for the closing notes. Business records and account access stay
        with TIRUPURCONNECT. Save draft, publish, then deploy the exported publication to update the
        live site.
      </p>
      <fieldset className="grid gap-3">
        <legend className="font-semibold">Images</legend>
        {(
          [
            ["heroImage", "Hero image"],
            ["categoryImage", "Textile category image sheet"],
            ["industryImage", "Industry image sheet"]
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <PageField
              label={label}
              value={textile[key]}
              onChange={(image) => update({ [key]: image })}
            />
            <img
              src={
                textile[key].startsWith("/")
                  ? `https://tirupurconnect.com${textile[key]}`
                  : textile[key]
              }
              alt={`${label} preview`}
              className="mt-2 h-32 w-48 object-cover"
            />
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          Choose deployed /textiles/ images or a public HTTPS JPG, PNG or WebP URL. Image uploads
          are not provided. Image sheets use a 3 by 2 crop; individual category images use the full
          picture.
        </p>
        <PageField
          label="Hero image description"
          value={textile.heroAlt}
          onChange={(heroAlt) => update({ heroAlt })}
        />
      </fieldset>
      {(["categories", "directory", "associations", "community", "journey", "banner"] as const).map(
        (key) => (
          <fieldset key={key} className="grid gap-3 border-t pt-4">
            <legend className="font-semibold capitalize">{key}</legend>
            {(["label", "title", "emphasis", "intro"] as const).map((field) => (
              <PageField
                key={field}
                label={`${key} ${field}`}
                multiline={field === "intro"}
                value={textile[key][field]}
                onChange={(text) => update({ [key]: { ...textile[key], [field]: text } })}
              />
            ))}
          </fieldset>
        )
      )}
      <PageField
        label="Banner image"
        value={textile.banner.image}
        onChange={(image) => update({ banner: { ...textile.banner, image } })}
      />
      <PageField
        label="Banner button"
        value={textile.banner.button}
        onChange={(button) => update({ banner: { ...textile.banner, button } })}
      />
      <fieldset className="grid gap-4">
        <legend className="font-semibold">Category panels</legend>
        {textile.categories.items.map((item, index) => (
          <div className="grid gap-2 border-t pt-3" key={index}>
            <PageField
              label={`Category ${index + 1} title`}
              value={item.title}
              onChange={(title) =>
                update({
                  categories: {
                    ...textile.categories,
                    items: textile.categories.items.map((entry, i) =>
                      i === index ? { ...entry, title } : entry
                    )
                  }
                })
              }
            />
            <PageField
              label="Description"
              multiline
              value={item.description}
              onChange={(description) =>
                update({
                  categories: {
                    ...textile.categories,
                    items: textile.categories.items.map((entry, i) =>
                      i === index ? { ...entry, description } : entry
                    )
                  }
                })
              }
            />
            <PageField
              label="Individual image (optional)"
              required={false}
              value={item.image ?? ""}
              onChange={(image) =>
                update({
                  categories: {
                    ...textile.categories,
                    items: textile.categories.items.map((entry, i) =>
                      i === index ? { ...entry, image: image || undefined } : entry
                    )
                  }
                })
              }
            />
          </div>
        ))}
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="font-semibold">Sourcing steps</legend>
        {textile.journey.items.map((item, index) => (
          <div key={index}>
            <PageField
              label={`Step ${index + 1} heading`}
              value={item.title}
              onChange={(title) =>
                update({
                  journey: {
                    ...textile.journey,
                    items: textile.journey.items.map((entry, i) =>
                      i === index ? { ...entry, title } : entry
                    )
                  }
                })
              }
            />
            <PageField
              label="Step description"
              multiline
              value={item.description}
              onChange={(description) =>
                update({
                  journey: {
                    ...textile.journey,
                    items: textile.journey.items.map((entry, i) =>
                      i === index ? { ...entry, description } : entry
                    )
                  }
                })
              }
            />
          </div>
        ))}
      </fieldset>
      <PageField
        label="Network pending heading"
        value={textile.notice.title}
        onChange={(title) => update({ notice: { ...textile.notice, title } })}
      />
      <PageField
        label="Network pending message"
        multiline
        value={textile.notice.body}
        onChange={(body) => update({ notice: { ...textile.notice, body } })}
      />
      <fieldset className="grid gap-4">
        <legend className="font-semibold">Public page copy</legend>
        {textile.documents.map((doc, index) => (
          <div className="grid gap-2 border-t pt-3" key={doc.path}>
            <strong>/{doc.path}</strong>
            <PageField
              label="Page heading"
              value={doc.title}
              onChange={(title) =>
                update({
                  documents: textile.documents.map((entry, i) =>
                    i === index ? { ...entry, title } : entry
                  )
                })
              }
            />
            <PageField
              label="Introduction"
              multiline
              value={doc.intro}
              onChange={(intro) =>
                update({
                  documents: textile.documents.map((entry, i) =>
                    i === index ? { ...entry, intro } : entry
                  )
                })
              }
            />
            <PageField
              label="Additional paragraphs (separate with blank lines)"
              multiline
              required={false}
              value={doc.paragraphs.join("\n\n")}
              onChange={(text) =>
                update({
                  documents: textile.documents.map((entry, i) =>
                    i === index
                      ? { ...entry, paragraphs: text.split("\n\n").filter(Boolean) }
                      : entry
                  )
                })
              }
            />
          </div>
        ))}
      </fieldset>
    </div>
  );
}
