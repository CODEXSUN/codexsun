import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@codexsun/ui/components/select";
import { serviceSlug } from "@codexsun/sites-api/page-routes";
import { Button } from "@codexsun/ui/components/button";
import { PageField } from "./page.fields.js";
import type { PageContent } from "./page.types.js";
import { logicxMarketingImages, type LogicxMarketing } from "@codexsun/sites-api/page-contract";
import { initialLogicxMarketing } from "@codexsun/sites-api/marketing-defaults";
import { PageMarketingCollections } from "./page.marketing-collections.js";

export function PageMarketingForm({
  value,
  onChange
}: {
  value: PageContent;
  onChange: (value: PageContent) => void;
}) {
  const marketing = value.marketing ?? structuredClone(initialLogicxMarketing);
  const update = (patch: Partial<LogicxMarketing>) =>
    onChange({ ...value, marketing: { ...marketing, ...patch } });
  const services = value.finishes.items.map((item) => ({
    name: item.name,
    slug: serviceSlug(item.name)
  }));
  const available = services.filter(
    (service) => !marketing.serviceImages.some((item) => item.slug === service.slug)
  );
  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">
        These sections belong to this client's draft. Save, then publish to update its website. Hero
        text, approach text, service descriptions, applications, and contact details use their
        existing section editors.
      </p>
      {!value.marketing ? (
        <Button variant="outline" onClick={() => update({})}>
          Add redesign sections to this draft
        </Button>
      ) : null}
      <details open className="grid gap-4 rounded-md border p-4">
        <summary className="mb-4 cursor-pointer font-semibold">
          Hero media, actions, and technology strip
        </summary>
        <div className="grid gap-4">
          <MarketingImageField
            label="Hero image"
            value={marketing.heroImage}
            onChange={(heroImage) => update({ heroImage })}
          />
          <MarketingImageField
            label="Approach image"
            value={marketing.approachImage}
            onChange={(approachImage) => update({ approachImage })}
          />
          <p className="text-sm text-muted-foreground">
            Choose an image from this client's collection. Save and publish when the changes are
            ready.
          </p>
          <PageField
            label="Hero project button"
            value={marketing.primaryLabel}
            onChange={(primaryLabel) => update({ primaryLabel })}
          />
          <PageField
            label="Hero approach button"
            value={marketing.secondaryLabel}
            onChange={(secondaryLabel) => update({ secondaryLabel })}
          />
          <PageField
            label="Header project button"
            value={marketing.navigationLabel}
            onChange={(navigationLabel) => update({ navigationLabel })}
          />
          <PageField
            label="Capability labels (one per line, no unsupported statistics)"
            multiline
            value={marketing.proofLabels.join("\n")}
            onChange={(text) => update({ proofLabels: lines(text) })}
          />
          <PageField
            label="Technologies (one per line)"
            multiline
            value={marketing.technologies.join("\n")}
            onChange={(text) => update({ technologies: lines(text) })}
          />
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">Featured services</legend>
            <p className="text-sm text-muted-foreground">
              Select up to six services in the order you want them to appear first.
            </p>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => {
                const index = marketing.featuredServices.indexOf(service.slug);
                return (
                  <Button
                    key={service.slug}
                    variant={index < 0 ? "outline" : "default"}
                    aria-pressed={index >= 0}
                    disabled={index < 0 && marketing.featuredServices.length >= 6}
                    onClick={() =>
                      update({
                        featuredServices:
                          index >= 0
                            ? marketing.featuredServices.filter((slug) => slug !== service.slug)
                            : [...marketing.featuredServices, service.slug]
                      })
                    }
                  >
                    {index >= 0 ? `${index + 1}. ` : ""}
                    {service.name}
                  </Button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </details>
      <details className="rounded-md border p-4">
        <summary className="cursor-pointer font-semibold">
          Section headings and calls to action
        </summary>
        <div className="mt-4 grid gap-6">
          {(
            [
              "services",
              "applications",
              "examples",
              "industries",
              "engagements",
              "faq",
              "closing"
            ] as const
          ).map((key) => (
            <fieldset key={key} className="grid gap-3 border-t pt-4">
              <legend className="font-semibold capitalize">{key}</legend>
              <PageField
                label={`${key} label`}
                value={marketing[key].label}
                onChange={(label) => update({ [key]: { ...marketing[key], label } })}
              />
              <PageField
                label={`${key} heading`}
                value={marketing[key].title}
                onChange={(title) => update({ [key]: { ...marketing[key], title } })}
              />
              <PageField
                label={`${key} introduction`}
                multiline
                value={marketing[key].intro}
                onChange={(intro) => update({ [key]: { ...marketing[key], intro } })}
              />
              <PageField
                label={`${key} button`}
                value={marketing[key].button}
                onChange={(button) => update({ [key]: { ...marketing[key], button } })}
              />
            </fieldset>
          ))}
        </div>
      </details>
      <details className="rounded-md border p-4">
        <summary className="cursor-pointer font-semibold">Service preview images</summary>
        <div className="mt-4 grid gap-4">
          {marketing.serviceImages.map((item, index) => (
            <fieldset className="grid gap-3 border-t pt-3" key={index}>
              <label className="grid gap-2 text-sm font-medium">
                <span>Service {index + 1}</span>
                <Select
                  value={item.slug}
                  onValueChange={(slug) =>
                    update({
                      serviceImages: marketing.serviceImages.map((entry, i) =>
                        i === index ? { ...entry, slug } : entry
                      )
                    })
                  }
                >
                  <SelectTrigger aria-label={`Service ${index + 1}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter(
                        (service) =>
                          service.slug === item.slug ||
                          !marketing.serviceImages.some((entry) => entry.slug === service.slug)
                      )
                      .map((service) => (
                        <SelectItem key={service.slug} value={service.slug}>
                          {service.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </label>
              <MarketingImageField
                label={`Service ${index + 1} image`}
                value={item.image}
                onChange={(image) =>
                  update({
                    serviceImages: marketing.serviceImages.map((entry, i) =>
                      i === index ? { ...entry, image } : entry
                    )
                  })
                }
              />
              <Button
                variant="outline"
                onClick={() =>
                  update({ serviceImages: marketing.serviceImages.filter((_, i) => i !== index) })
                }
              >
                Remove image mapping {index + 1}
              </Button>
            </fieldset>
          ))}
          <Button
            variant="outline"
            disabled={!available.length || marketing.serviceImages.length >= 30}
            onClick={() =>
              update({
                serviceImages: [
                  ...marketing.serviceImages,
                  {
                    slug: available[0]?.slug ?? "new-service",
                    image: "/service-previews/custom-software.svg"
                  }
                ]
              })
            }
          >
            Add service image mapping
          </Button>
        </div>
      </details>
      <PageMarketingCollections
        value={marketing}
        onChange={(marketing) => onChange({ ...value, marketing })}
      />
    </div>
  );
}

function lines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function MarketingImageField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {logicxMarketingImages.map((image) => (
            <SelectItem key={image.path} value={image.path}>
              {image.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
