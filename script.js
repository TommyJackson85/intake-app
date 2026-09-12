const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navigation = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll("[data-reveal]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function closeNavigation() {
  navToggle?.setAttribute("aria-expanded", "false");
  navigation?.classList.remove("open");
  document.body.classList.remove("nav-open");
}

navToggle?.addEventListener("click", () => {
  const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
  navToggle.setAttribute("aria-expanded", String(willOpen));
  navigation?.classList.toggle("open", willOpen);
  document.body.classList.toggle("nav-open", willOpen);
});

navLinks.forEach((link) => link.addEventListener("click", closeNavigation));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation?.classList.contains("open")) {
    closeNavigation();
    navToggle?.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 800) closeNavigation();
});

function updateHeader() {
  header?.classList.toggle("scrolled", window.scrollY > 12);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

function revealNode(item) {
  item.classList.add("visible");
}

function revealHashTarget() {
  const id = window.location.hash.slice(1);
  if (!id) return null;
  let target = null;
  try {
    target = document.getElementById(id);
  } catch {
    return null;
  }
  if (!target) return null;
  // Transform on [data-reveal] can interfere with native hash scrolling; reveal
  // the target (and any reveal ancestors) first, then scroll it into view.
  if (target.hasAttribute("data-reveal")) revealNode(target);
  target.querySelectorAll?.("[data-reveal]")?.forEach(revealNode);
  let parent = target.parentElement;
  while (parent) {
    if (parent.hasAttribute?.("data-reveal")) revealNode(parent);
    parent = parent.parentElement;
  }
  target.scrollIntoView({ block: "start", behavior: "auto" });
  return target;
}

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach(revealNode);
} else {
  // threshold: 0 — any visible pixel reveals. Tall nodes (e.g. full article
  // bodies) never reached the old 0.12 ratio until hundreds of px scrolled,
  // which left opacity:0 content looking "missing" on Insights articles.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealNode(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -4% 0px", threshold: 0 },
  );

  revealItems.forEach((item) => {
    // Article body copy must never wait on scroll-triggered reveal.
    if (item.classList.contains("article-body")) {
      revealNode(item);
      return;
    }
    observer.observe(item);
  });
}

// Deep links like #research-questionnaire must land on visible content.
revealHashTarget();
window.addEventListener("hashchange", revealHashTarget);

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
