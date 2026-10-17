import { PageMarketingForm } from "./page.marketing-form.js";
import { PageApplicationsForm } from "./page.applications-form.js";
import { PageResponsibilityForm } from "./page.responsibility-form.js";
import { PageFinishesForm } from "./page.finishes-form.js";
import { PageField } from "./page.fields.js";
import { PageTitleForm } from "./page.title-form.js";
import { PageProcessingForm } from "./page.processing-form.js";
import type { PageContent } from "./page.types.js";
import type { PageSection } from "./page.list.js";
export function PageForm({
  value,
  onChange,
  section
}: {
  value: PageContent;
  onChange: (value: PageContent) => void;
  section: PageSection;
}) {
  const hero = value.hero;
  return (
    <div className="grid gap-5">
      {section === "marketing" ? <PageMarketingForm value={value} onChange={onChange} /> : null}
      {section === "applications" ? (
        <PageApplicationsForm value={value} onChange={onChange} />
      ) : null}
      {section === "seo" ? (
        <>
          <PageField
            label="Browser title"
            value={value.pageTitle}
            onChange={(pageTitle) => onChange({ ...value, pageTitle })}
          />
          <PageField
            label="Meta description"
            multiline
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
          />
        </>
      ) : null}
      {section === "hero" ? (
        <>
          <PageField
            label="Eyebrow"
            value={hero.eyebrow}
            onChange={(eyebrow) => onChange({ ...value, hero: { ...hero, eyebrow } })}
          />
          <PageField
            label="Heading line 1"
            value={hero.title}
            onChange={(title) => onChange({ ...value, hero: { ...hero, title } })}
          />
          <PageField
            label="Heading line 2"
            value={hero.secondLine}
            onChange={(secondLine) => onChange({ ...value, hero: { ...hero, secondLine } })}
          />
          <PageField
            label="Emphasized line"
            value={hero.emphasis}
            onChange={(emphasis) => onChange({ ...value, hero: { ...hero, emphasis } })}
          />
          <PageField
            label="Introduction"
            multiline
            value={hero.intro}
            onChange={(intro) => onChange({ ...value, hero: { ...hero, intro } })}
          />
          <PageField
            label="Button label"
            value={hero.button}
            onChange={(button) => onChange({ ...value, hero: { ...hero, button } })}
          />
          <PageField
            label="Caption"
            value={hero.caption}
            onChange={(caption) => onChange({ ...value, hero: { ...hero, caption } })}
          />
          <PageField
            label="Artwork label"
            value={hero.artLabel}
            onChange={(artLabel) => onChange({ ...value, hero: { ...hero, artLabel } })}
          />
          <PageField
            label="Artwork title"
            value={hero.artTitle}
            onChange={(artTitle) => onChange({ ...value, hero: { ...hero, artTitle } })}
          />
          <PageField
            label="Artwork emphasis"
            value={hero.artEmphasis}
            onChange={(artEmphasis) => onChange({ ...value, hero: { ...hero, artEmphasis } })}
          />
        </>
      ) : null}
      {section === "materials" ? (
        <>
          <PageField
            label="Focus areas / fibre types (one per line)"
            multiline
            value={value.materials.names.join("\n")}
            onChange={(text) =>
              onChange({
                ...value,
                materials: {
                  ...value.materials,
                  names: text.split("\n").filter((line) => line.trim())
                }
              })
            }
          />
          <PageField
            label="Focus strip caption"
            value={value.materials.caption}
            onChange={(caption) =>
              onChange({ ...value, materials: { ...value.materials, caption } })
            }
          />
        </>
      ) : null}
      {section === "about" ? (
        <>
          <PageTitleForm
            value={value.about}
            onChange={(title) => onChange({ ...value, about: { ...value.about, ...title } })}
          />
          <PageField
            label="Lead paragraph"
            multiline
            value={value.about.lead}
            onChange={(lead) => onChange({ ...value, about: { ...value.about, lead } })}
          />
          <PageField
            label="Body paragraphs (separate with blank lines)"
            multiline
            value={value.about.paragraphs.join("\n\n")}
            onChange={(text) =>
              onChange({ ...value, about: { ...value.about, paragraphs: text.split("\n\n") } })
            }
          />
          <PageField
            label="Company profile link label"
            value={value.about.profileLink}
            onChange={(profileLink) =>
              onChange({ ...value, about: { ...value.about, profileLink } })
            }
          />
        </>
      ) : null}
      {section === "processing" ? (
        <>
          <PageTitleForm
            value={value.processing}
            onChange={(title) =>
              onChange({ ...value, processing: { ...value.processing, ...title } })
            }
          />
          <PageProcessingForm
            value={value.processing}
            onChange={(processing) => onChange({ ...value, processing })}
          />
        </>
      ) : null}
      {section === "finishes" ? <PageFinishesForm value={value} onChange={onChange} /> : null}
      {section === "responsibility" ? (
        <PageResponsibilityForm value={value} onChange={onChange} />
      ) : null}
      {section === "equipment" ? (
        <>
          <PageField
            label="Equipment section label"
            value={value.equipment.label}
            onChange={(label) => onChange({ ...value, equipment: { ...value.equipment, label } })}
          />
          <PageField
            label="Technology / equipment names (one per line)"
            required={false}
            multiline
            value={value.equipment.names.join("\n")}
            onChange={(text) =>
              onChange({
                ...value,
                equipment: {
                  ...value.equipment,
                  names: text.split("\n").filter((line) => line.trim())
                }
              })
            }
          />
          <PageField
            label="Equipment note"
            value={value.equipment.note}
            onChange={(note) => onChange({ ...value, equipment: { ...value.equipment, note } })}
          />
        </>
      ) : null}
      {section === "contact" ? (
        <>
          <PageTitleForm
            value={value.contact}
            onChange={(title) => onChange({ ...value, contact: { ...value.contact, ...title } })}
          />
          <PageField
            label="Office heading"
            value={value.contact.officeLabel}
            onChange={(officeLabel) =>
              onChange({ ...value, contact: { ...value.contact, officeLabel } })
            }
          />
          <PageField
            label="Map link label"
            value={value.contact.mapLabel}
            onChange={(mapLabel) => onChange({ ...value, contact: { ...value.contact, mapLabel } })}
          />
          <PageField
            label="Enquiry form heading"
            value={value.contact.formTitle}
            onChange={(formTitle) =>
              onChange({ ...value, contact: { ...value.contact, formTitle } })
            }
          />
          <PageField
            label="Enquiry form introduction"
            multiline
            value={value.contact.formIntro}
            onChange={(formIntro) =>
              onChange({ ...value, contact: { ...value.contact, formIntro } })
            }
          />
        </>
      ) : null}
      {section === "footer" ? (
        <>
          <PageField
            label="Footer line 1"
            value={value.footer.lineOne}
            onChange={(lineOne) => onChange({ ...value, footer: { ...value.footer, lineOne } })}
          />
          <PageField
            label="Footer line 2"
            value={value.footer.lineTwo}
            onChange={(lineTwo) => onChange({ ...value, footer: { ...value.footer, lineTwo } })}
          />
        </>
      ) : null}
    </div>
  );
}
