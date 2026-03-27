import { sectionsContent } from "./content.js";

const dayText = document.getElementById("day-text");
const dateText = document.getElementById("date-text");
const timeText = document.getElementById("time-text");
const yearText = document.getElementById("year-text");
const rotationValue = document.getElementById("rotation-value");
const lazyShells = document.querySelectorAll(".lazy-shell");
const revealEls = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".side-link");

function updateClockText() {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "short" });
  const date = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  dayText.textContent = day;
  dateText.textContent = date;
  timeText.textContent = time;
  yearText.textContent = String(now.getFullYear());
}

function hydrateSection(shell) {
  const key = shell.dataset.section;
  if (!key || shell.dataset.loaded === "true") {
    return;
  }

  shell.innerHTML = sectionsContent[key] ?? "<p class=\"placeholder\">Content coming soon.</p>";
  shell.dataset.loaded = "true";
}

const lazyObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        hydrateSection(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "180px 0px" }
);

lazyShells.forEach((shell) => lazyObserver.observe(shell));

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealEls.forEach((el) => revealObserver.observe(el));

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const activeId = entry.target.id;
      navLinks.forEach((link) => {
        const isActive = link.dataset.target === activeId;
        link.classList.toggle("active", isActive);
      });
    });
  },
  { threshold: 0.55 }
);

sections.forEach((section) => navObserver.observe(section));

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = link.dataset.target;
    const target = document.getElementById(targetId);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

let displayRotation = 35;
setInterval(() => {
  displayRotation += 1;
  if (displayRotation > 359) {
    displayRotation = 0;
  }
  rotationValue.textContent = `${displayRotation}\u00b0`;
}, 120);

updateClockText();
setInterval(updateClockText, 60_000);
