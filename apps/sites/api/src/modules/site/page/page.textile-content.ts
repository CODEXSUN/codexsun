import type { PageContent } from "./page.schema.js";
export const initialTextileContent = {
  heroImage: "/textiles/textile-hero.webp",
  heroAlt:
    "Illustrative studio still life of cotton knits and yarn in forest green, ivory and terracotta",
  categoryImage: "/textiles/textile-collection.webp",
  industryImage: "/textiles/industry-collection.webp",
  categories: {
    label: "EXPLORE TIRUPUR’S TEXTILE ECOSYSTEM",
    title: "Different expertise.",
    emphasis: "Same ambition.",
    intro:
      "From the first fibre to the final shipment. Find your place in a connected textile community.",
    items: [
      {
        title: "Yarn & Fibre",
        description: "Cotton, blended and recycled yarns. Start with the right fibre."
      },
      {
        title: "Knitted Fabrics",
        description: "Jersey, rib, interlock. Possibilities by the metre."
      },
      {
        title: "Dyeing & Processing",
        description: "Dyeing, bleaching and finishing partners for your next collection."
      },
      {
        title: "Garment Manufacturing",
        description: "T-shirts, kidswear and everyday knits, from sampling to production."
      },
      {
        title: "Printing & Embroidery",
        description: "Screen printing, digital prints and embroidery with a point of view."
      },
      {
        title: "Accessories & Packaging",
        description: "Labels, trims and thoughtful packaging. Every detail matters."
      },
      {
        title: "Textile Machinery",
        description: "The engineering behind everyday excellence."
      },
      {
        title: "Quality Testing",
        description: "Confidence at every stage."
      },
      {
        title: "Sourcing & Merchandising",
        description: "Partners for your next collection."
      },
      {
        title: "Logistics & Export Services",
        description: "Local expertise. A world of destinations."
      },
      {
        title: "Sustainable Textiles",
        description: "New beginnings for fibres and ideas."
      },
      {
        title: "Textile Business Services",
        description: "Specialists who help you move forward."
      }
    ]
  },
  directory: {
    label: "DISCOVER YOUR NEXT PARTNER",
    title: "Good people.",
    emphasis: "The right expertise.",
    intro:
      "From fabric development to your next production run. Meet businesses with capabilities that match your brief."
  },
  associations: {
    label: "BUSINESS IS BETTER TOGETHER",
    title: "Your industry.",
    emphasis: "In good company.",
    intro:
      "Find the people, associations and specialist networks behind Tirupur’s textile ecosystem."
  },
  community: {
    label: "IDEAS WORTH SHARING",
    title: "Keep good knowledge",
    emphasis: "in circulation.",
    intro: "Sourcing knowledge, announcements and conversations from the textile community."
  },
  journey: {
    label: "LESS SEARCHING. MORE POSSIBILITY.",
    title: "From first hello",
    emphasis: "to what’s next.",
    intro:
      "A fabric sample. A production partner. A better quotation. Give your next textile project a clearer starting point.",
    items: [
      {
        title: "Find your specialist.",
        description:
          "Explore yarn, fabric, garments and services. Search by capability and location to build your shortlist."
      },
      {
        title: "Make the brief matter.",
        description:
          "Share your blend, GSM, quantity and delivery needs. Send a product enquiry or post a buyer requirement."
      },
      {
        title: "See the whole offer.",
        description:
          "Compare price, tax, delivery and payment terms. Keep questions and seller replies together in your private conversations."
      }
    ]
  },
  banner: {
    label: "MADE IN TIRUPUR. WORN EVERYWHERE.",
    title: "One connection can",
    emphasis: "change what comes next.",
    intro: "Find your next textile connection.",
    image: "/textiles/textile-hero.webp",
    button: "Join Tirupur Connect"
  },
  notice: {
    title: "A new chapter for Tirupur’s textile community.",
    body: "We’re preparing company discovery and new accounts. Explore the textile ecosystem while the network comes online."
  },
  documents: [
    {
      path: "contact",
      title: "Let’s make a connection.",
      intro:
        "For platform questions, profile corrections and association enquiries, reach the Tirupur Connect team.",
      paragraphs: []
    },
    {
      path: "join",
      title: "Your next chapter starts here.",
      intro:
        "Choose the account that fits your work. Buyers source products and compare offers. Businesses manage profiles, products and enquiries.",
      paragraphs: []
    },
    {
      path: "login",
      title: "Your next chapter starts here.",
      intro: "Choose your buyer or business account to continue.",
      paragraphs: []
    },
    {
      path: "privacy",
      title: "Privacy, with clarity.",
      intro:
        "Public profiles and private account information serve different purposes. Contact our team for privacy questions.",
      paragraphs: []
    },
    {
      path: "terms",
      title: "A shared understanding.",
      intro:
        "Buyers and sellers must independently confirm specifications, credentials, pricing, tax, delivery and commercial terms.",
      paragraphs: []
    },
    {
      path: "standards",
      title: "Better questions. More confident sourcing.",
      intro: "Explore official standards, then ask suppliers for current documentation.",
      paragraphs: []
    },
    {
      path: "enterprises",
      title: "A distinctive presence. A wider conversation.",
      intro: "Discover the capabilities behind your next textile partnership.",
      paragraphs: []
    }
  ]
} as const;
export function tirupurConnectPage(base: PageContent): PageContent {
  return {
    ...base,
    pageTitle: "Tirupur Connect | Textile Business Network",
    description: "Find textile suppliers, meet buyers and grow with Tirupur’s textile community.",
    profile: {
      ...base.profile,
      name: "Tirupur Connect",
      brand: "Tirupur Connect",
      location: "Tirupur",
      tagline: "Made in Tirupur. Worn Everywhere.",
      domain: "tirupurconnect.com",
      emails: ["info@tirupurconnect.com"],
      phones: [{ label: "9655227767", href: "+919655227767" }]
    },
    hero: {
      ...base.hero,
      eyebrow: "TIRUPUR’S TEXTILE BUSINESS NETWORK",
      title: "Good Textile",
      secondLine: "Business Starts with a",
      emphasis: "Great Connection.",
      intro: "Find trusted suppliers. Meet global buyers. Grow with Tirupur’s textile community."
    },
    footer: {
      lineOne: "Made in Tirupur. Worn Everywhere.",
      lineTwo:
        "Demonstration listings are fictional. Information is supplied by profile owners; no verification is implied unless current reviewed credential details are published."
    },
    textile: structuredClone(initialTextileContent) as unknown as NonNullable<
      PageContent["textile"]
    >
  };
}
