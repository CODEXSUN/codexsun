export type DocsTemplateCategory = {
  name: string
  slug: string
}

export type DocsTemplate = {
  name: string
  description: string
  image: string
  repo: string
  slug: string
  category: DocsTemplateCategory
  url: string
  features: string[]
  sections: string[]
}

const docsTemplateCategoryMap = {
  landingPage: {
    name: "Landing Page",
    slug: "landing-page",
  },
  portfolio: {
    name: "Portfolio",
    slug: "portfolio",
  },
} satisfies Record<string, DocsTemplateCategory>

export const docsTemplateCategories = Object.values(docsTemplateCategoryMap)

export const docsTemplates: DocsTemplate[] = [
  {
    name: "HomeGuardian",
    description: "A clean landing page template with a service-first structure.",
    image: "/images/templates/homeguardian-landing-page.png",
    repo: "akash3444/homeguardian-codexsun-landing-page",
    slug: "homeguardian",
    category: docsTemplateCategoryMap.landingPage,
    url: "https://homeguardian-codexsun-landing-page.vercel.app/",
    features: [
      "Next 15",
      "React 19",
      "Tailwind CSS 4",
      "Codexsun UI",
      "TypeScript",
      "Responsive Design",
      "SEO Optimized",
    ],
    sections: [
      "Hero",
      "Why Choose Us",
      "Features",
      "Industries",
      "FAQ",
      "Footer",
    ],
  },
  {
    name: "Minimalist Landing Page",
    description: "A neutral landing page starter for product and studio sites.",
    image: "/images/templates/minimalist-landing-page.png",
    repo: "akash3444/codexsun-ui-landing-page",
    slug: "minimalist-landing-page",
    category: docsTemplateCategoryMap.landingPage,
    url: "https://codexsun-ui-landing-page.vercel.app/",
    features: [
      "Next 15",
      "React 19",
      "Tailwind CSS",
      "Codexsun UI",
      "TypeScript",
      "Responsive Design",
      "SEO Optimized",
    ],
    sections: ["Hero", "Features", "Pricing", "FAQ", "Footer"],
  },
  {
    name: "PureLanding",
    description: "A simple landing template with clear sections and CTA flow.",
    image: "/images/templates/pure-landing.png",
    repo: "akash3444/pure-landing-codexsunui-template",
    slug: "pure-landing",
    category: docsTemplateCategoryMap.landingPage,
    url: "https://pure-landing-codexsunui-template.vercel.app/",
    features: [
      "Next 15",
      "React 19",
      "Tailwind CSS",
      "Codexsun UI",
      "TypeScript",
      "Responsive Design",
      "SEO Optimized",
    ],
    sections: ["Hero", "Features", "Pricing", "FAQ", "CTA Banner", "Footer"],
  },
  {
    name: "Minimal Portfolio",
    description: "A portfolio template for presenting work, experience, and profile.",
    image: "/images/templates/minimal-portfolio.png",
    repo: "akash3444/portfolio-template",
    slug: "minimal-portfolio",
    category: docsTemplateCategoryMap.portfolio,
    url: "https://codexsun-portfolio-template.vercel.app/",
    features: [
      "Next 15",
      "React 19",
      "Tailwind CSS 4",
      "Codexsun UI",
      "TypeScript",
      "Responsive Design",
      "SEO Optimized",
    ],
    sections: ["Hero", "About", "Experience", "Projects", "Footer"],
  },
]
