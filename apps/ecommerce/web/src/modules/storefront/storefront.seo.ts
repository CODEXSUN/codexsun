const business = {
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
    addressLocality: "Tiruppur",
    addressRegion: "Tamil Nadu",
    postalCode: "641602",
    streetAddress: "436, Avinashi Road"
  },
  name: "Tech Media",
  telephone: "+91 98946 44450"
} as const;

export function setStorefrontSeo(input: {
  description: string;
  path: string;
  robots?: string;
  structuredData?: Record<string, unknown>;
  title: string;
}) {
  const canonicalUrl = new URL(input.path, window.location.origin).toString();
  document.title = input.title;
  setMeta("description", input.description);
  setMeta("og:title", input.title, "property");
  setMeta("og:description", input.description, "property");
  setMeta("og:url", canonicalUrl, "property");
  setMeta("og:type", input.structuredData ? "product" : "website", "property");
  setMeta("og:site_name", business.name, "property");
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", input.title);
  setMeta("twitter:description", input.description);
  setMeta("robots", input.robots ?? "index,follow,max-image-preview:large,max-snippet:-1");
  setLink("canonical", canonicalUrl);
  setStructuredData(
    input.structuredData ?? {
      "@context": "https://schema.org",
      "@type": "ComputerStore",
      ...business,
      description: input.description,
      url: window.location.origin
    }
  );
}

export function createProductStructuredData(input: {
  brand: string | null;
  description: string;
  imageUrl: string;
  name: string;
  price: number;
  slug: string;
}) {
  const productUrl = new URL(
    `/shop/product/${encodeURIComponent(input.slug)}`,
    window.location.origin
  ).toString();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
        description: input.description,
        image: [new URL(input.imageUrl, window.location.origin).toString()],
        name: input.name,
        offers:
          input.price > 0
            ? { "@type": "Offer", price: input.price, priceCurrency: "INR", url: productUrl }
            : undefined,
        url: productUrl
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", item: window.location.origin, name: "Home", position: 1 },
          {
            "@type": "ListItem",
            item: new URL("/shop", window.location.origin).toString(),
            name: "Shop",
            position: 2
          },
          { "@type": "ListItem", item: productUrl, name: input.name, position: 3 }
        ]
      }
    ]
  };
}

function setMeta(name: string, content: string, attribute = "name") {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.append(element);
  }
  element.content = content;
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.append(element);
  }
  element.href = href;
}

function setStructuredData(value: Record<string, unknown>) {
  const id = "tech-media-business-schema";
  let element = document.getElementById(id) as HTMLScriptElement | null;
  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.append(element);
  }
  element.text = JSON.stringify(value);
}
