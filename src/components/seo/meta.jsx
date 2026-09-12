import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { buildCanonicalUrl } from "@/lib/seo";
import {
  buildPageGraph,
  crumbsFromPath,
  DEFAULT_SOCIAL_IMAGE,
} from "@/lib/schema";
import metaDataConfig from "../../meta/meta.json";

const DEFAULT_META = {
  title: "Academy of Internal Audit | Best Training Institute For Top Certification Courses - AIA",
  description:
    "Academy of Internal Audit (AIA) is Online Training Institute for Global Certification Courses like CIA, CFE, and other International Certification Courses.",
  keywords: "CIA, CFE, CAMS, Internal Audit, Training Institute, Fraud Examiner, Academy of Internal Audit",
};

const UPPERCASE_WORDS = {
  aia: "AIA",
  cams: "CAMS",
  cfe: "CFE",
  cia: "CIA",
  ciac: "CIAC",
};

function titleFromSlug(value = "") {
  return decodeURIComponent(value)
    .split("-")
    .filter(Boolean)
    .map((word) => UPPERCASE_WORDS[word.toLowerCase()] || `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function cfeModuleTitle(value = "") {
  const match = value.match(/^cfe-(\d+)$/i);
  return match ? `CFE Module ${match[1]}` : titleFromSlug(value);
}

function buildDynamicMeta(pathname) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "blogs" && parts[1] === "course" && parts[2]) {
    const courseName = titleFromSlug(parts[2]);
    return {
      title: `${courseName} Certification Articles | Academy of Internal Audit`,
      description: `Explore ${courseName} certification articles, exam tips, syllabus guidance, and career insights from Academy of Internal Audit experts.`,
      keywords: `${courseName} blogs, ${courseName} certification articles, ${courseName} exam tips`,
    };
  }

  if (parts[0] === "cfe-free-resource" && parts[1]) {
    const moduleName = cfeModuleTitle(parts[1]);
    return {
      title: `${moduleName} Practice Questions | Free CFE Resources`,
      description: `Practice ${moduleName} questions with answers and explanations from Academy of Internal Audit to strengthen your CFE exam preparation.`,
      keywords: `${moduleName} practice questions, CFE free resources, CFE exam preparation`,
    };
  }

  if (parts[0] === "passout-stories" && parts[1]) {
    const storyName = titleFromSlug(parts[1]);
    return {
      title: `${storyName} | Student Success Story | AIA`,
      description: `Read ${storyName}'s AIA success story after clearing CIA, CFE or CAMS exams. Get inspired by their journey, preparation strategy, and results.`,
      keywords: `${storyName} success story, AIA alumni, CIA CFE CAMS results`,
    };
  }

  return null;
}

function matchRoute(pathname) {
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";

  return Object.keys(metaDataConfig)
    .sort((a, b) => b.split("/").length - a.split("/").length)
    .find((route) => {
      if (!route.includes(":")) return route === normalizedPathname;

      const routeParts = route.split("/").filter(Boolean);
      const pathParts = normalizedPathname.split("/").filter(Boolean);

      return (
        routeParts.length === pathParts.length &&
        routeParts.every((part, index) => part.startsWith(":") || part === pathParts[index])
      );
    });
}

export default function Meta() {
  const { pathname } = useLocation();
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const routeKey = matchRoute(pathname);
  const pageMeta = buildDynamicMeta(normalizedPathname) || metaDataConfig[routeKey] || DEFAULT_META;

  const canonicalUrl = buildCanonicalUrl(pathname);

  const isProductionHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "aia.in.net" || window.location.hostname === "www.aia.in.net");
  const robotsMeta = isProductionHost ? pageMeta.robots || "index, follow" : "noindex, nofollow";

  // Single connected entity graph: Organization + WebSite + WebPage +
  // BreadcrumbList with stable @ids. One script tag, no competing entities.
  // (Review / AggregateRating intentionally omitted: self-published
  // testimonials are ineligible self-serving reviews per Google policy.)
  const pageGraph = buildPageGraph({
    canonicalUrl,
    title: pageMeta.title,
    description: pageMeta.description,
    crumbs: crumbsFromPath(normalizedPathname, buildCanonicalUrl),
  });

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageMeta.title}</title>
      <meta name="title" content={pageMeta.title} />
      <meta name="description" content={pageMeta.description} />
      <meta name="keywords" content={pageMeta.keywords || DEFAULT_META.keywords} />
      <meta name="robots" content={robotsMeta} />
      <meta name="application-name" content="Academy of Internal Audit" />

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageMeta.title} />
      <meta property="og:description" content={pageMeta.description} />
      <meta property="og:image" content={DEFAULT_SOCIAL_IMAGE} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content="Academy of Internal Audit" />
      <meta property="og:site_name" content="Academy of Internal Audit" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter (spec uses `name`, not `property`) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={pageMeta.title} />
      <meta name="twitter:description" content={pageMeta.description} />
      <meta name="twitter:image" content={DEFAULT_SOCIAL_IMAGE} />
      <meta name="twitter:image:alt" content="Academy of Internal Audit" />
      <meta name="twitter:site" content="@AcademyAudit" />

      {/* Structured Data: single @graph */}
      <script type="application/ld+json">
        {JSON.stringify(pageGraph)}
      </script>
    </Helmet>
  );
}
