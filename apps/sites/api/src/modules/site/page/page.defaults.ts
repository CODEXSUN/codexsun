import { initialRamuTexPage, initialLogicxPage } from "./page.content.js";
import type { PageContent } from "./page.schema.js";
import type { PageOwner } from "./page.types.js";

export function initialSitePage(site: PageOwner): PageContent {
  if (site.slug === "ramutex") return structuredClone(initialRamuTexPage);
  if (site.slug === "logicx") return structuredClone(initialLogicxPage);
  const name = site.name ?? site.slug;
  return {
    pageTitle: name,
    description: site.description || `Learn about ${name}, our services and how to contact us.`,
    profile: {
      name,
      brand: name,
      location: "",
      tagline: "Welcome to our portfolio",
      domain: site.primaryDomain ?? "example.com",
      emails: [],
      phones: [],
      address: [],
      gstin: ""
    },
    hero: {
      eyebrow: name,
      title: "Welcome to",
      secondLine: name,
      emphasis: "Let’s work together.",
      intro: site.description || `Explore ${name} and get in touch to discuss your requirements.`,
      button: "Explore our services",
      caption: "Our company · Our services",
      artLabel: "Our portfolio",
      artTitle: "Ideas and",
      artEmphasis: "possibilities."
    },
    materials: { names: ["Our company", "Our services"], caption: "Discover our work" },
    about: {
      label: "About us",
      title: "Meet",
      emphasis: name,
      intro: `Learn more about ${name}.`,
      lead: site.description || `Welcome to ${name}.`,
      paragraphs: ["Contact our team to learn more about our work and discuss your requirements."],
      profileLink: "Contact our team"
    },
    processing: {
      label: "Our process",
      title: "A clear path",
      emphasis: "from brief to delivery.",
      intro: "Discuss your requirements with our team.",
      foundationLabel: "Getting started",
      foundation: ["Discuss", "Plan", "Deliver"],
      lines: [
        {
          title: "Working together",
          description: "Agree the requirements, scope and next steps.",
          stages: [
            ["Your brief", "Tell us what you need"],
            ["Next steps", "Agree the scope with our team"]
          ]
        }
      ]
    },
    finishes: {
      label: "Services",
      title: "What",
      emphasis: "we do.",
      intro: "Contact our team for our current services and availability.",
      items: []
    },
    responsibility: {
      label: "Our approach",
      title: "Working",
      emphasis: "together.",
      intro: "Clear communication from the first conversation.",
      linkLabel: "Contact us",
      note: "Discuss your requirements with our team.",
      items: []
    },
    equipment: { label: "Our capabilities", names: [], note: "Contact us for further details." },
    contact: {
      label: "Contact us",
      title: "Start a",
      emphasis: "conversation.",
      intro: "Discuss your requirements with our team.",
      officeLabel: "Contact details",
      mapLabel: "Our location",
      formTitle: "Get in touch",
      formIntro: "Tell us about your requirements."
    },
    footer: { lineOne: name, lineTwo: "Company portfolio" }
  };
}
