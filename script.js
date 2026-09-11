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

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("visible"));
} else {
  // threshold: 0 — any visible pixel reveals. Tall nodes (e.g. full article
  // bodies) never reached the old 0.12 ratio until hundreds of px scrolled,
  // which left opacity:0 content looking "missing" on Insights articles.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -4% 0px", threshold: 0 },
  );

  revealItems.forEach((item) => {
    // Article body copy must never wait on scroll-triggered reveal.
    if (item.classList.contains("article-body")) {
      item.classList.add("visible");
      return;
    }
    observer.observe(item);
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());
