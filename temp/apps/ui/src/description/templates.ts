export interface Template {
  name: string;
  description: string;
  image: string;
  repo: string;
  slug: string;
  category: {
    name: string;
    slug: string;
  };
  url: string;
  features: string[];
  sections: string[];
}

const categoriesMap = {
  landingPage: {
    name: "Landing Page",
    slug: "landing-page",
  },
  portfolio: {
    name: "Portfolio",
    slug: "portfolio",
  },
};

export const categories = Object.values(categoriesMap);

export const templates = [
  {
    name: "HomeGuardian",
    description:
      "A beautifully designed landing page template with a clean and modern look.",
    image: "/images/templates/homeguardian-landing-page.png",
    repo: "akash3444/homeguardian-codexsun-landing-page",
    slug: "homeguardian",
    category: categoriesMap.landingPage,
    url: "https://homeguardian-codexsun-landing-page.vercel.app/",
    features: [
      "Next 15",
      "React 19",
      "Tailwind CSS 4",
      "codexsun UI",
      "TypeScript",
      "Dark Mode Support",
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
    description:
      "A beautifully designed landing page template with a clean and modern look.",
    image: "/images/templates/minimalist-landing-page.png",
    repo: "akash3444/codexsun-ui-landing-page",
    slug: "minimalist-landing-page",
    category: categoriesMap.landingPage,
    url: "https://codexsun-ui-landing-page.vercel.app/",
    features: [
      "Next 15",
      "React 19",
      "Tailwind CSS",
      "codexsun UI",
      "TypeScript",
      "Dark Mode Support",
      "Responsive Design",
      "SEO Optimized",
    ],
    sections: ["Hero", "Features", "Pricing", "FAQ", "Footer"],
  },
  {
    name: "PureLanding",
    description:
      "A beautifully designed landing page template with a clean and modern look.",
    image: "/images/templates/pure-landing.png",
    repo: "akash3444/pure-landing-codexsunui-template",
    slug: "pure-landing",
    category: categoriesMap.landingPage,
    url: "https://pure-landing-codexsunui-template.vercel.app/",
    features: [
      "Next 15",
      "React 19",
      "Tailwind CSS",
      "codexsun UI",
      "TypeScript",
      "Dark Mode Support",
      "Responsive Design",
      "SEO Optimized",
    ],
    sections: ["Hero", "Features", "Pricing", "FAQ", "CTA Banner", "Footer"],
  },
  {
    name: "Minimal Portfolio",
    description:
      "A beautifully designed developer portfolio template with a clean and modern look.",
    image: "/images/templates/minimal-portfolio.png",
    repo: "akash3444/portfolio-template",
    slug: "minimal-portfolio",
    category: categoriesMap.portfolio,
    url: "https://codexsun-portfolio-template.vercel.app/",
    features: [
      "Next 15",
      "React 19",
      "Tailwind CSS 4",
      "codexsun UI",
      "TypeScript",
      "Dark Mode Support",
      "Responsive Design",
      "SEO Optimized",
    ],
    sections: ["Hero", "About", "Experience", "Projects", "Footer"],
  },
] as Template[];

const getCategorizedTemplates = () => {
  return templates.reduce(
    (acc, template) => {
      acc[template.category.slug] = [
        ...(acc[template.category.slug] || []),
        template,
      ];
      return acc;
    },
    {} as Record<string, Template[]>
  );
};

export const categorizedTemplates = getCategorizedTemplates();
