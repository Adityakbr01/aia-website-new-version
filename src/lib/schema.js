/**
 * Single source of truth for all Schema.org structured data.
 *
 * Design rules enforced here:
 * - Stable `@id` references so Organization / WebSite / WebPage / BreadcrumbList
 *   merge into one entity graph instead of conflicting duplicates.
 * - NO Review / AggregateRating output. The testimonials API carries no rating
 *   field, and self-published testimonials about our own Organization/Courses
 *   are classified by Google as self-serving reviews and are ineligible for
 *   rich results. Emitting hardcoded 5/5 ratings would be fake markup.
 * - NO WebSite SearchAction: Google retired the sitelinks search box, and the
 *   `/blogs/?s=` target has no search handler in this app.
 * - All user/CMS-controlled text is passed through stripHtml so Answer /
 *   description values are plain text as Google requires.
 * - Dependency-free ESM so this module can be imported by both the React app
 *   (via `@/lib/schema`) and the Node build scripts.
 */

export const SITE_URL = "https://aia.in.net";
export const ROOT_URL = `${SITE_URL}/`;
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const LOGO_URL =
  "https://aia.in.net/webapi/public/assets/images/web_images/new_logo.webp";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/android-chrome-512x512.png`;

export const ORG_NAME = "Academy of Internal Audit";
export const ORG_ALTERNATE_NAME = "AIA";

export const SAME_AS = [
  "https://www.facebook.com/academyofinternalaudit",
  "https://twitter.com/AcademyAudit",
  "https://www.instagram.com/academyofia/",
  "https://www.linkedin.com/company/academy-of-internal-audit",
  "https://in.pinterest.com/academyofia/",
  "https://www.youtube.com/@academyofia",
];

/** Human-readable course names keyed by the testimonial/course slug. */
export const COURSE_META = {
  CAMS: {
    name: "Certified Anti-Money Laundering Specialist (CAMS) Training",
    description:
      "CAMS certification training by the Academy of Internal Audit: exam-focused study guidance, practice questions and expert support for the Certified Anti-Money Laundering Specialist exam.",
  },
  CFE: {
    name: "Certified Fraud Examiner (CFE) Training",
    description:
      "CFE certification training by the Academy of Internal Audit: exam-focused study guidance, practice questions and expert support for the Certified Fraud Examiner exam.",
  },
  CIA: {
    name: "Certified Internal Auditor (CIA) Training",
    description:
      "CIA certification training by the Academy of Internal Audit: exam-focused study guidance, practice questions and expert support for the Certified Internal Auditor exam.",
  },
  CIAC: {
    name: "CIA Challenge Exam Training",
    description:
      "CIA Challenge exam training by the Academy of Internal Audit: fast-track exam-focused guidance and support for eligible auditors.",
  },
  CISA: {
    name: "Certified Information Systems Auditor (CISA) Training",
    description:
      "CISA certification training by the Academy of Internal Audit: exam-focused study guidance and expert support for the Certified Information Systems Auditor exam.",
  },
};

/**
 * Strip HTML tags/entities down to plain text for schema string values.
 * Google requires plain text (no markup) in e.g. FAQ Answer.text.
 */
export function stripHtml(value = "") {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(br|p|div|li|tr|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Collapse CMS text to a single-line plain-text string. */
export function plainText(value = "") {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

/** ISO 8601 datetime (`YYYY-MM-DDTHH:mm:ssZ`) or empty string. */
export function toIsoDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

/** ISO calendar date (`YYYY-MM-DD`) or empty string. */
export function toIsoDate(value) {
  const iso = toIsoDateTime(value);
  return iso ? iso.split("T")[0] : "";
}

export function buildOrganization() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: ORG_NAME,
    alternateName: ORG_ALTERNATE_NAME,
    url: ROOT_URL,
    logo: LOGO_URL,
    sameAs: SAME_AS,
  };
}

export function buildWebsite() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: ORG_NAME,
    alternateName: [ORG_NAME, ORG_ALTERNATE_NAME, "AIA Institute", "aia.in.net"],
    url: ROOT_URL,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function buildWebPage({ canonicalUrl, title, description }) {
  const page = {
    "@type": "WebPage",
    "@id": canonicalUrl,
    url: canonicalUrl,
    name: title,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en",
  };
  if (description) page.description = description;
  return page;
}

/**
 * BreadcrumbList for a canonical URL.
 * `crumbs` is an ordered array of { name, url } starting AFTER Home.
 * Home is always position 1.
 */
export function buildBreadcrumb(canonicalUrl, crumbs = []) {
  const itemListElement = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: ROOT_URL,
    },
    ...crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 2,
      name: crumb.name,
      item: crumb.url,
    })),
  ];
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement,
  };
}

/** Derive human-readable breadcrumb crumbs from a canonical path. */
export function crumbsFromPath(pathname, canonicalFor) {
  const parts = String(pathname || "")
    .split("/")
    .filter(Boolean);
  return parts.map((part, index) => {
    const url = canonicalFor(`/${parts.slice(0, index + 1).join("/")}`);
    const name = decodeURIComponent(part)
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return { name: name || part, url };
  });
}

/**
 * Full per-page entity graph. Emitted as ONE
 * `<script type="application/ld+json">` so validators see a single
 * connected graph instead of competing top-level entities.
 */
export function buildPageGraph({ canonicalUrl, title, description, crumbs = [] }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganization(),
      buildWebsite(),
      buildWebPage({ canonicalUrl, title, description }),
      buildBreadcrumb(canonicalUrl, crumbs),
    ],
  };
}

/**
 * Minimal Course markup WITHOUT ratings/reviews (the data model has no
 * rating field; self-serving ratings are ineligible for rich results).
 * Returns null for unknown slugs so nothing invalid is emitted.
 */
export function buildCourse({ slug, canonicalUrl }) {
  const meta = COURSE_META[String(slug || "").toUpperCase()];
  if (!meta || !canonicalUrl) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${canonicalUrl}#course`,
    name: meta.name,
    description: meta.description,
    provider: { "@id": ORG_ID },
  };
}

/** BlogPosting with @id-linked author/publisher and ISO datetimes. */
export function buildBlogPosting({
  headline,
  description,
  image,
  canonicalUrl,
  datePublished,
  dateModified,
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#blogposting`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    headline: plainText(headline).slice(0, 200) || "AIA Blog",
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
  const cleanDescription = plainText(description);
  if (cleanDescription) schema.description = cleanDescription.slice(0, 500);
  if (image) schema.image = image;
  const published = toIsoDateTime(datePublished);
  const modified = toIsoDateTime(dateModified) || published;
  if (published) schema.datePublished = published;
  if (modified) schema.dateModified = modified;
  return schema;
}

/** FAQPage from visible Q&A items. Returns null when there is no genuine FAQ. */
export function buildFAQPage(faqItems = []) {  const mainEntity = (faqItems || [])
    .map((item) => {
      const question = plainText(item.question);
      const answer = stripHtml(item.answer);
      if (!question || !answer) return null;
      return {
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      };
    })
    .filter(Boolean);
  if (mainEntity.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

// ---------------------------------------------------------------------------
// Build-time HTML helpers (used by scripts/post-build-seo.js).
// Kept here so the exact dedupe logic shipped to production is unit-testable.
// ---------------------------------------------------------------------------

const LD_JSON_SCRIPT_REGEX =
  /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;

/** Remove every JSON-LD script block for which `predicate(tag)` is true. */
export function removeLdJsonScripts(html, predicate) {
  return String(html).replace(LD_JSON_SCRIPT_REGEX, (tag) =>
    predicate(tag) ? "" : tag,
  );
}

/** Prerendered Helmet output for the shared site entities. */
export function isAiaSiteGraphScript(tag) {
  return (
    String(tag).includes("https://aia.in.net/#organization") ||
    String(tag).includes("https://aia.in.net/#website")
  );
}

export function isBlogPostingScript(tag) {
  return /"@type"\s*:\s*"BlogPosting"/.test(String(tag));
}

/** Any BreadcrumbList block (current @graph or legacy standalone format). */
export function isBreadcrumbScript(tag) {
  return /"@type"\s*:\s*"BreadcrumbList"/.test(String(tag));
}

/**
 * Legacy policy-violating markup: hardcoded AggregateRating / Review blocks
 * from the old testimonial components. The app no longer emits these types
 * anywhere, so any such block found in prerendered HTML is stale and unsafe
 * to keep. (FAQPage scripts never contain these markers and are preserved.)
 */
export function isLegacyReviewScript(tag) {
  const text = String(tag);
  return (
    text.includes("AggregateRating") || /"@type"\s*:\s*"Review"/.test(text)
  );
}

export function appendLdJson(html, schema) {
  const tag = `<script type="application/ld+json" data-rh="true">${JSON.stringify(schema)}</script>`;
  if (String(html).includes("</head>")) {
    return String(html).replace("</head>", `    ${tag}\n</head>`);
  }
  return `${String(html)}\n${tag}`;
}
