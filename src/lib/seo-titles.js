/**
 * Automatically ensures all <img> and <a> elements have valid `title` attributes
 * for comprehensive SEO compliance and accessibility tooling.
 */

let scheduledTimer = null;

export function initSeoTitles() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const updateTitles = () => {
    // 1. Ensure all images have a title attribute matching their alt text or fallback
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      const currentTitle = img.getAttribute("title");
      if (!currentTitle || !currentTitle.trim()) {
        const alt = img.getAttribute("alt") || img.getAttribute("aria-label");
        if (alt && alt.trim()) {
          img.setAttribute("title", alt.trim());
        } else {
          img.setAttribute("title", "Academy of Internal Audit");
        }
      }
    });

    // 2. Ensure all links have a title attribute matching their anchor text or aria-label
    const links = document.querySelectorAll("a");
    links.forEach((a) => {
      const currentTitle = a.getAttribute("title");
      if (!currentTitle || !currentTitle.trim()) {
        const aria = a.getAttribute("aria-label");
        const text = (a.textContent || "").trim();
        const href = a.getAttribute("href") || "";
        const rawTitle =
          aria ||
          text ||
          (href && href !== "#" && !href.startsWith("javascript:")
            ? href
            : "Academy of Internal Audit");
        const cleanTitle = rawTitle.replace(/\s+/g, " ").trim();

        if (cleanTitle && cleanTitle !== "#") {
          a.setAttribute("title", cleanTitle.slice(0, 120));
        } else {
          a.setAttribute("title", "Academy of Internal Audit");
        }
      }
    });
  };

  const requestUpdate = () => {
    if (scheduledTimer) return;
    scheduledTimer = setTimeout(() => {
      scheduledTimer = null;
      updateTitles();
    }, 60);
  };

  // Run immediately
  updateTitles();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateTitles, { once: true });
    window.addEventListener("load", updateTitles, { once: true });
  } else {
    requestUpdate();
  }

  // Observe dynamically mounted elements (lazy carousels, popups, student reviews)
  const observer = new MutationObserver(() => {
    requestUpdate();
  });

  const observeOptions = { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "alt"] };

  if (document.body) {
    observer.observe(document.body, observeOptions);
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        if (document.body) {
          observer.observe(document.body, observeOptions);
        }
      },
      { once: true }
    );
  }

  // Periodic safety pass during initial async data loading (TanStack Query / API hydration)
  let pollCount = 0;
  const initialPoller = setInterval(() => {
    updateTitles();
    pollCount++;
    if (pollCount > 10) clearInterval(initialPoller);
  }, 400);
}

