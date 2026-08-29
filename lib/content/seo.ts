import { SITE_URL, business } from "@/lib/content/business";
import type { TarotSpecialist } from "@/lib/content/demo";

type JsonLd = Record<string, unknown>;

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: business.name,
    alternateName: "Suriya",
    url: SITE_URL,
    logo: absoluteUrl("/icon-512.png"),
    description: business.description,
    areaServed: { "@type": "City", name: "Yangon" },
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: business.name,
    url: SITE_URL,
    inLanguage: "my",
    description: business.description,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })),
  };
}

export function articleJsonLd(input: { headline: string; description: string; path: string; keywords: string[]; modified: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    inLanguage: "my",
    keywords: input.keywords.join(", "),
    mainEntityOfPage: absoluteUrl(input.path),
    dateModified: input.modified,
    author: { "@type": "Organization", name: business.name },
    publisher: { "@type": "Organization", name: business.name, logo: { "@type": "ImageObject", url: absoluteUrl("/icon-512.png") } },
  };
}

export function collectionJsonLd(input: { name: string; description: string; path: string; items: Array<{ name: string; path: string }> }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: "my",
    hasPart: input.items.map((item) => ({ "@type": "WebPage", name: item.name, url: absoluteUrl(item.path) })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

export function webPageJsonLd(input: { name: string; description: string; path: string; modified: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: "my",
    dateModified: input.modified,
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: business.name },
  };
}

export function localBusinessJsonLd(specialists: TarotSpecialist[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Service"],
    "@id": absoluteUrl("/tarot#business"),
    name: `${business.name} Tarot`,
    legalName: business.legalName,
    url: absoluteUrl("/tarot"),
    description: business.description,
    image: absoluteUrl("/og.png"),
    priceRange: business.priceRange,
    ...(business.phone ? { telephone: business.phone } : {}),
    address: { "@type": "PostalAddress", addressLocality: business.locality, addressRegion: business.region, addressCountry: business.country },
    areaServed: { "@type": "City", name: "Yangon" },
    openingHours: business.openingHours,
    serviceType: "Tarot reading (in person)",
    employee: specialists.map((item) => ({ "@type": "Person", name: item.name, jobTitle: item.specialty, url: absoluteUrl(`/tarot/${item.id}`) })),
    makesOffer: specialists.map((item) => ({
      "@type": "Offer",
      name: `${item.name} · ${business.sessionMinutes} မိနစ် Tarot ဆွေးနွေးမှု`,
      url: absoluteUrl(`/tarot/${item.id}#booking`),
      priceCurrency: "MMK",
      description: item.rate,
      availability: "https://schema.org/InStock",
    })),
  };
}

/** Serialise for a <script type="application/ld+json">; escape `<` so the JSON can never close the tag. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
