import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const packagePath = path.join(rootDir, "package.json");
const sitemapPath = path.join(rootDir, "public", "sitemap.xml");
const siteOrigin = "https://aia.in.net";

const staticRoutes = new Set([
  "/",
  "/about-aia",
  "/cfe-curriculum",
  "/cia-curriculum",
  "/cia-challenge-curriculum",
  "/cams",
  "/cia-free-resources",
  "/cams-free-resources",
  "/cfe-free-resources",
  "/blogs",
  "/our-passouts",
  "/enroll-now",
  "/contact",
  "/corporate-training",
  "/policies",
  "/terms-and-conditions",
]);

const redirectOnlyRoutes = new Set([
  "/about-us",
  "/passed-out",
  "/corpo",
  "/enroll",
]);

const dynamicSeoRoutePatterns = [
  /^\/blogs\/[^/]+$/,
  /^\/blogs\/course\/[^/]+$/,
  /^\/passout-stories\/[^/]+$/,
  /^\/cfe-free-resource\/[^/]+$/,
];

function normalizePath(value) {
  if (!value) return "";

  let pathname = String(value).trim();

  try {
    const parsed = new URL(pathname, siteOrigin);
    if (parsed.origin !== siteOrigin) return "";
    pathname = parsed.pathname;
  } catch {
    return "";
  }

  try {
    pathname = decodeURI(pathname);
  } catch {
    return "";
  }

  pathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return pathname.replace(/\/+$/, "") || "/";
}

function isSeoSafeRoute(pathname) {
  if (!pathname || redirectOnlyRoutes.has(pathname)) return false;
  if (pathname.includes(":") || pathname.includes("*")) return false;
  if (pathname === "/404" || pathname === "/404.html") return false;
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;

  return (
    staticRoutes.has(pathname) ||
    dynamicSeoRoutePatterns.some((pattern) => pattern.test(pathname))
  );
}

function readSitemapRoutes() {
  if (!fs.existsSync(sitemapPath)) return [];

  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  return Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), ([, loc]) =>
    normalizePath(loc),
  );
}

const sitemapRoutes = readSitemapRoutes();
const include = Array.from(
  new Set([
    ...[...staticRoutes, ...sitemapRoutes].filter(isSeoSafeRoute),
    "/404.html",
  ]),
).sort((a, b) => {
  if (a === "/") return -1;
  if (b === "/") return 1;
  return a.localeCompare(b);
});

const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

packageJson.reactSnap = {
  ...packageJson.reactSnap,
  include,
};

fs.writeFileSync(`${packagePath}.tmp`, `${JSON.stringify(packageJson, null, 2)}\n`);
fs.renameSync(`${packagePath}.tmp`, packagePath);

console.log(`Prepared react-snap include list with ${include.length} SEO-safe routes.`);
