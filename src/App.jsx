import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  ArrowUpRight,
  ArrowUp,
  ArrowLeft,
} from "lucide-react";

const TESSERACT_VERTICES = Array.from({ length: 16 }, (_, index) => [
  index & 1 ? 1 : -1,
  index & 2 ? 1 : -1,
  index & 4 ? 1 : -1,
  index & 8 ? 1 : -1,
]);

const TESSERACT_EDGES = [];
for (let from = 0; from < 16; from += 1) {
  for (let axis = 0; axis < 4; axis += 1) {
    const to = from ^ (1 << axis);
    if (from < to) {
      TESSERACT_EDGES.push([from, to]);
    }
  }
}

function rotatePair(a, b, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  return [a * cosine - b * sine, a * sine + b * cosine];
}

function projectVertex(vertex, angle) {
  let [x, y, z, w] = vertex;

  [x, w] = rotatePair(x, w, angle * 0.92);
  [y, z] = rotatePair(y, z, angle * 0.66);
  [x, z] = rotatePair(x, z, angle * 0.47);
  [y, w] = rotatePair(y, w, angle * 0.38);
  [z, w] = rotatePair(z, w, angle * 0.58);

  const wPerspective = 1 / (2.7 - w * 0.85);
  const x3 = x * wPerspective;
  const y3 = y * wPerspective;
  const z3 = z * wPerspective;
  const depth = 1 / (3.8 - z3 * 1.35);

  return {
    x: x3 * depth,
    y: y3 * depth,
    z: z3,
    glow: depth,
  };
}

const TesseractProjection = () => {
  const frameRef = useRef(0);
  const [angle, setAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let animationFrameId = 0;
    let previousTime = 0;

    const step = (time) => {
      if (!previousTime) {
        previousTime = time;
      }

      const delta = time - previousTime;
      previousTime = time;
      frameRef.current += delta * (isHovered ? 0.00115 : 0.00062);
      setAngle(frameRef.current);
      animationFrameId = window.requestAnimationFrame(step);
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered]);

  const projected = useMemo(() => {
    const scale = 140;
    return TESSERACT_VERTICES.map((vertex) => {
      const point = projectVertex(vertex, angle);
      return {
        x: point.x * scale,
        y: point.y * scale,
        z: point.z,
        glow: point.glow,
      };
    });
  }, [angle]);

  const sortedEdges = useMemo(() => {
    return [...TESSERACT_EDGES].sort((edgeA, edgeB) => {
      const depthA = (projected[edgeA[0]].z + projected[edgeA[1]].z) / 2;
      const depthB = (projected[edgeB[0]].z + projected[edgeB[1]].z) / 2;
      return depthA - depthB;
    });
  }, [projected]);

  return (
    <div
      className="group relative h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] lg:h-[400px] lg:w-[400px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.55),transparent_62%)] opacity-70 blur-2xl"></div>

      <svg viewBox="-160 -160 320 320" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <radialGradient id="tesseractCore" cx="50%" cy="46%" r="58%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="52%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id="tesseractGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.4" result="blurred" />
            <feMerge>
              <feMergeNode in="blurred" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="0" cy="0" r="200" fill="url(#tesseractCore)" opacity="0.8" />

        {sortedEdges.map(([from, to]) => {
          const start = projected[from];
          const end = projected[to];
          const depth = (start.glow + end.glow) / 2;
          const opacity = 0.26 + depth * 0.72;
          const width = 1.2 + depth * 2.6;

          return (
            <line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={`rgba(51, 65, 85, ${opacity})`}
              strokeWidth={width}
              strokeLinecap="round"
              filter="url(#tesseractGlow)"
            />
          );
        })}

        {projected
          .map((point, index) => ({ ...point, index }))
          .sort((a, b) => a.z - b.z)
          .map((point) => {
            const radius = 1.5 + point.glow * 2.8;
            const opacity = 0.3 + point.glow * 0.8;

            return (
              <g key={point.index}>
                <circle cx={point.x} cy={point.y} r={radius * 2.2} fill={`rgba(255,255,255,${opacity * 0.12})`} />
                <circle cx={point.x} cy={point.y} r={radius} fill={`rgba(71, 85, 105, ${opacity})`} />
              </g>
            );
          })}
      </svg>


    </div>
  );
};

const GlassButton = ({ children, icon: Icon, onClick, className = "", ...rest }) => {
  const hasLabel = Boolean(children);

  return (
    <button
      onClick={onClick}
      className={`
        relative group overflow-hidden rounded-full
        bg-white/10 backdrop-blur-md
        border border-white/40
        shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_8px_20px_rgba(0,0,0,0.08)]
        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        hover:scale-[1.05] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),_0_12px_24px_rgba(0,0,0,0.12)]
        active:scale-95 active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.1),_0_4px_10px_rgba(0,0,0,0.1)]
        flex items-center justify-center ${hasLabel ? "gap-2 px-6 py-3" : "gap-0 p-0"}
        ${className}
      `}
      {...rest}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute top-0 -left-[100%] h-full w-[150%] animate-[liquidShine_1.5s_infinite_ease-in-out] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

      {Icon && (
        <Icon
          size={18}
          className="relative z-10 font-light text-slate-800 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 group-hover:scale-110"
        />
      )}
      {hasLabel && (
        <span className="relative z-10 font-medium tracking-wide text-slate-800 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.02]">
          {children}
        </span>
      )}
    </button>
  );
};

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-16">
    <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">{subtitle}</div>
    <h2 className="text-4xl font-light tracking-tight text-slate-900">{title}</h2>
    <div className="mt-6 h-px w-12 bg-slate-400"></div>
  </div>
);

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [time, setTime] = useState(new Date());
  const [expandedBusiness, setExpandedBusiness] = useState(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const navRailRef = useRef(null);
  const [navIndicator, setNavIndicator] = useState({ top: 0, height: 0, ready: false });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector(".custom-scrollbar");
    const sections = Array.from(document.querySelectorAll("section"));

    if (!scrollContainer || sections.length === 0) {
      return;
    }

    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      setHasScrolled((previous) => {
        const next = scrollContainer.scrollTop > 8;
        return previous === next ? previous : next;
      });

      const marker = scrollContainer.scrollTop + scrollContainer.clientHeight * 0.35;

      let currentId = sections[0].id;
      for (const section of sections) {
        if (section.offsetTop <= marker) {
          currentId = section.id;
        } else {
          break;
        }
      }

      setActiveSection((previous) => (previous === currentId ? previous : currentId));
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    requestUpdate();
    scrollContainer.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      scrollContainer.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "businesses", label: "Businesses" },
    { id: "portfolio", label: "Portfolio" },
    { id: "skills", label: "Capabilities" },
    { id: "contact", label: "Contact" },
  ];

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRailRef.current) {
        return;
      }

      const target = navRailRef.current.querySelector(`[data-nav-id="${activeSection}"]`);
      if (!target) {
        return;
      }

      setNavIndicator({ top: target.offsetTop, height: target.offsetHeight, ready: true });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeSection]);

  const businessExperiments = [
    {
      name: "Drinking water Blob",
      period: "2019",
      state: "failure",
      detail: "First post-dropout venture with limited network and weak capital structure.",
      outcome: "Failed quickly; exposed execution gaps.",
      context: "Entered the market with high conviction but no reliable systems for sourcing, distribution, or cash-flow control.",
      failureSignal: "Overconfidence before operational understanding.",
      learning: "Execution rhythm and unit economics matter more than motivation.",
    },
    {
      name: "Restaurant Reservation Platform",
      period: "2019 - 2020",
      state: "failure",
      detail: "Iterated 6+ months on product and fit.",
      outcome: "Stopped after direction mismatch.",
      context: "Built and refined for months, but demand and distribution pathways were not validated early enough.",
      failureSignal: "High effort in a low-signal direction.",
      learning: "Direction compounds faster than effort when resources are limited.",
    },
    {
      name: "Perfume & Fragrance Shop",
      period: "2021",
      state: "failure",
      detail: "Launched using rebuilt savings; operated around 6 months.",
      outcome: "Collapsed from seasonality and flood impact.",
      context: "Funded by daily-wage savings and launched with limited risk buffers.",
      failureSignal: "External shocks plus fragile operating margin.",
      learning: "Resilience planning is part of business design, not an afterthought.",
    },
    {
      name: "Amazon FBA Attempt",
      period: "2021",
      state: "failure",
      detail: "Parallel marketplace test for sourcing and listing strategy.",
      outcome: "Loss from weak selection and execution.",
      context: "Ran simultaneously with offline operations, reducing focus and decision quality.",
      failureSignal: "Poor product-market assumptions at listing stage.",
      learning: "Selection and distribution quality decide outcomes before scaling.",
    },
    {
      name: "Trading System",
      period: "2022",
      state: "success",
      detail: "Rebuilt capital with stricter process and pattern recognition.",
      outcome: "Reached consistency and funded next moves.",
      context: "Returned to disciplined routines and rule-based execution after repeated losses.",
      failureSignal: "Earlier versions were inconsistent and emotionally driven.",
      learning: "Repeatable systems outperform impulsive decisions.",
    },
    {
      name: "EIGHTY6TH",
      period: "2023 - 2026",
      state: "failure",
      detail: "Bootstrapped brand across production, marketplaces, and own website.",
      outcome: "Shutdown after capital drain; strong lessons in distribution.",
      context: "Built product and brand quality iteratively, but lacked sustained marketing runway.",
      failureSignal: "Traction gap despite prolonged build cycles.",
      learning: "Distribution design must be solved as early as product design.",
    },
  ];

  const selectedBusiness = businessExperiments.find((item) => item.name === expandedBusiness) ?? null;

  const getBusinessTone = (state) => {
    if (state === "success") {
      return {
        cardBorder: "border-green-200/85",
        cardBg: "bg-green-50/10 hover:bg-green-50/16 shadow-[0_0_0_1px_rgba(187,247,208,0.16),0_0_26px_rgba(74,222,128,0.09)]",
        heading: "text-green-700/92",
        tab: "border-green-200/85 bg-green-100/50",
        badge: "border-green-200/85 bg-green-100/46 text-green-700/90 shadow-[0_0_18px_rgba(74,222,128,0.1)]",
        line: "border-green-200/70",
        body: "text-slate-700/90",
        bodyStrong: "text-slate-800/95",
        meta: "text-green-700/72",
        panel: "border-green-200/75 bg-green-50/18 shadow-[0_0_18px_rgba(74,222,128,0.05)]",
      };
    }

    return {
      cardBorder: "border-rose-200/85",
      cardBg: "bg-rose-50/9 hover:bg-rose-50/14 shadow-[0_0_0_1px_rgba(254,205,211,0.16),0_0_26px_rgba(251,113,133,0.08)]",
      heading: "text-rose-700/92",
      tab: "border-rose-200/85 bg-rose-100/48",
      badge: "border-rose-200/85 bg-rose-100/44 text-rose-700/90 shadow-[0_0_18px_rgba(251,113,133,0.09)]",
      line: "border-rose-200/70",
      body: "text-slate-700/90",
      bodyStrong: "text-slate-800/95",
      meta: "text-rose-700/72",
      panel: "border-rose-200/75 bg-rose-50/16 shadow-[0_0_18px_rgba(251,113,133,0.05)]",
    };
  };

  const formatDate = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${days[date.getDay()]} - ${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#eef3f6] font-sans text-slate-700 selection:bg-slate-200">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .translate-z-32 { transform: translateZ(8rem); }
        .-translate-z-32 { transform: translateZ(-8rem); }
        .translate-x-32 { transform: translateX(8rem) rotateY(90deg); }
        .-translate-x-32 { transform: translateX(-8rem) rotateY(-90deg); }
        .translate-y-32 { transform: translateY(8rem) rotateX(-90deg); }
        .-translate-y-32 { transform: translateY(-8rem) rotateX(90deg); }
        @keyframes spin3d {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }
        .animate-spin-slow { animation: spin3d 20s linear infinite; }
        .animate-spin-fast { animation: spin3d 10s linear infinite; }

        @keyframes tesseractSpin {
          0% { transform: rotateX(-20deg) rotateY(0deg) rotateZ(-10deg); }
          25% { transform: rotateX(18deg) rotateY(88deg) rotateZ(6deg); }
          50% { transform: rotateX(-12deg) rotateY(180deg) rotateZ(12deg); }
          75% { transform: rotateX(20deg) rotateY(270deg) rotateZ(-6deg); }
          100% { transform: rotateX(-20deg) rotateY(360deg) rotateZ(-10deg); }
        }

        @keyframes innerPhase {
          0% { transform: translate3d(34px, -28px, 34px) rotateX(0deg) rotateY(0deg); }
          50% { transform: translate3d(34px, -28px, 34px) rotateX(180deg) rotateY(180deg); }
          100% { transform: translate3d(34px, -28px, 34px) rotateX(360deg) rotateY(360deg); }
        }

        .tesseract-shell { transform-style: preserve-3d; }
        .tesseract-assembly {
          animation: tesseractSpin 16s cubic-bezier(0.55, 0.08, 0.33, 0.95) infinite;
        }
        .group:hover .tesseract-assembly {
          animation-duration: 10s;
        }
        .tesseract-assembly > div:nth-child(2) {
          animation: innerPhase 14s linear infinite;
        }

        @keyframes liquidShine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(100%) skewX(-15deg); }
        }

        @keyframes windowIn {
          0% { opacity: 0; transform: translateY(14px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes blurIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes liquidFlow {
          0% { transform: translateX(-120%) skewX(-16deg); }
          100% { transform: translateX(140%) skewX(-16deg); }
        }

        @keyframes navLiquidSweep {
          0% { transform: translateX(-140%) skewX(-18deg); }
          100% { transform: translateX(220%) skewX(-18deg); }
        }

        @keyframes scrollLiquidFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.82; }
          50% { transform: translateX(-50%) translateY(-6px); opacity: 1; }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.6); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `,
        }}
      />

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/65 via-white/10 to-transparent"></div>

      <div className="pointer-events-none fixed left-0 top-0 z-40 w-full px-3 pt-3 sm:px-6 sm:pt-5">
        <div
          className={`mx-auto flex w-full max-w-6xl items-start justify-between px-3 py-2 text-sm font-medium tracking-wide text-slate-700 transition-all duration-400 sm:px-5 ${
            hasScrolled
              ? "rounded-2xl border border-white/70 bg-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78),_0_10px_22px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="font-semibold">{formatDate(time)}</span>
          </div>
          <div className="font-medium tracking-wider">{time.getFullYear()}</div>
        </div>
      </div>

      <div className="fixed left-4 top-1/2 z-40 hidden w-48 -translate-y-1/2 xl:left-8 xl:w-52 lg:block">
        <div className="rounded-2xl border border-white/70 bg-white/34 p-3 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_8px_20px_rgba(15,23,42,0.05)]">
          <div className="mb-3 px-2 text-[10px] uppercase tracking-[0.26em] text-slate-500">System Menu</div>
          <nav ref={navRailRef} className="relative flex flex-col gap-1">
            <div
              className={`pointer-events-none absolute left-0 right-0 overflow-hidden rounded-lg border border-white/85 bg-white/78 shadow-[0_6px_16px_rgba(148,163,184,0.28)] transition-[transform,height,opacity] duration-500 ease-out ${
                navIndicator.ready ? "opacity-100" : "opacity-0"
              }`}
              style={{
                transform: `translateY(${navIndicator.top}px)`,
                height: `${navIndicator.height}px`,
              }}
            >
              <span
                className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70"
                style={{ animation: "navLiquidSweep 1400ms linear infinite" }}
              />
            </div>
            {navItems.map((item, index) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  data-nav-id={item.id}
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`group relative z-10 flex w-full items-center justify-between overflow-hidden rounded-lg px-2.5 py-2 text-left text-[12px] uppercase tracking-[0.14em] transition-all duration-300 ${
                    isActive
                      ? "text-slate-800"
                      : "text-slate-500 hover:bg-white/55 hover:text-slate-800"
                  }`}
                >
                  <span className="relative z-10 font-medium">{item.label}</span>
                  <span className={`relative z-10 text-[10px] ${isActive ? "text-slate-500" : "text-slate-400 group-hover:text-slate-600"}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="fixed bottom-6 left-4 z-40 hidden border border-slate-300/80 bg-white/22 p-2 font-mono text-[8px] uppercase leading-tight tracking-wider text-slate-500 backdrop-blur-sm sm:block md:bottom-8 md:left-8 md:p-3 md:text-[10px]">
        END
        <br />
        IS
        <br />
        UI .
      </div>

      <div className="fixed bottom-6 right-4 z-40 text-xs font-medium tracking-wider text-slate-500 sm:text-sm md:bottom-8 md:right-8">013</div>

      <div className="custom-scrollbar relative z-10 ml-0 h-screen flex-1 overflow-y-auto scroll-smooth lg:ml-64">
        <div className="mx-auto max-w-4xl px-4 pb-32 pt-20 sm:px-8 sm:pb-48 sm:pt-24 lg:px-16 lg:pb-64 lg:pt-32">
          <section id="home" className="relative mb-16 flex min-h-[80vh] flex-col justify-center sm:mb-24 lg:mb-32">
            <div className="pointer-events-none absolute right-0 top-0 opacity-20 mix-blend-overlay">
              <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="mt-8 flex w-full flex-col items-center justify-between gap-8 sm:gap-12 lg:mt-12 lg:gap-32 lg:flex-row">
              <div className="z-10 flex-1">
                <div className="mb-3 text-[9px] uppercase tracking-[0.3em] text-slate-500 sm:mb-4 lg:mb-6">Builder / Entrepreneur</div>
                <h1 className="mb-4 text-3xl font-light leading-[1.1] tracking-tighter text-slate-800 sm:text-4xl lg:mb-6 lg:text-7xl">
                  Fayas P <br />
                  <span className="font-semibold">Sulfikkar</span>
                </h1>
                <div className="flex gap-3 sm:gap-4">
                  <GlassButton icon={ArrowUpRight} onClick={() => scrollTo("portfolio")}>
                    View Portfolio
                  </GlassButton>
                </div>
              </div>

              <div className="flex h-[280px] flex-1 items-center justify-center sm:h-[340px] lg:h-[420px]">
                <TesseractProjection />
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollTo("businesses")}
              className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/70 bg-white/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-slate-500 backdrop-blur-sm transition-colors duration-300 hover:bg-white/48 sm:bottom-5 lg:hidden"
              style={{ animation: "scrollLiquidFloat 1.8s ease-in-out infinite" }}
            >
              Scroll
            </button>
          </section>



          <section id="businesses" className="min-h-auto py-8 sm:py-10 lg:py-12">
            <SectionHeading subtitle="01 / Businesses" title="Business" />

            <div className="relative grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {businessExperiments.map((business) => {
                const tone = getBusinessTone(business.state);
                return (
                  <article
                    key={business.name}
                    className={`group relative h-[198px] overflow-hidden rounded-xl border text-xs backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${tone.cardBorder} ${tone.cardBg}`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedBusiness(business.name)}
                      className="flex h-full w-full flex-col p-3 text-left sm:p-3.5"
                    >
                      <div className={`absolute left-1.5 top-0 h-1 w-8 -translate-y-[1px] rounded-b-md border-x border-b ${tone.tab}`}></div>

                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className={`flex-1 text-[12px] font-semibold uppercase tracking-[0.07em] leading-tight sm:text-[13px] ${tone.heading}`}>
                          {business.name}
                        </h3>
                        <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] sm:text-[9px] ${tone.badge}`}>
                          {business.period}
                        </span>
                      </div>

                      <div className={`flex flex-1 flex-col border-t pt-2 ${tone.line}`}>
                        <p className={`text-[12px] leading-snug line-clamp-2 sm:text-[13px] ${tone.body}`}>{business.detail}</p>
                        <p className={`mt-1.5 text-[11px] leading-snug line-clamp-2 sm:text-[12px] ${tone.bodyStrong}`}>
                          <span className="font-medium">Outcome:</span> {business.outcome}
                        </p>
                        <p className={`mt-auto pt-1 text-[9px] italic tracking-[0.14em] sm:text-[10px] ${tone.meta}`}>Click to enter the folder &gt;</p>
                      </div>
                    </button>
                  </article>
                );
              })}

            </div>
          </section>

          <section id="portfolio" className="min-h-auto py-8 sm:py-10 lg:py-12">
            <SectionHeading subtitle="02 / Portfolio" title="Selected Works" />
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:mb-5 sm:text-[15px]">
              Built through vibe coding: fast product intuition, rapid interface iteration, and execution-first refinement.
            </p>

            <div className="relative grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {[
                {
                  title: "interactive-universe",
                  desc: "Interactive JavaScript concept project focused on motion, response, and exploratory interface ideas.",
                  stack: "JavaScript",
                  year: "Public",
                  url: "https://interactive-universe-five.vercel.app/",
                },
                {
                  title: "money-pro",
                  desc: "Structured HTML project iteration with cleaner layouts and practical cash-flow style modules.",
                  stack: "HTML",
                  year: "Public",
                  url: "https://fayaspsulfikkar.github.io/money-pro/",
                },
                {
                  title: "money-pulse",
                  desc: "JavaScript-based project exploring money tracking logic and lightweight interactive behavior.",
                  stack: "JavaScript",
                  year: "Public",
                  url: "https://money-pulse-bay.vercel.app/",
                },
                {
                  title: "self-log",
                  desc: "Personal operating log documenting phases of failure, adaptation, and reconstruction over time.",
                  stack: "HTML",
                  year: "Public",
                  url: "https://github.com/fayaspsulfikkar/self-log",
                },
              ].map((project) => (
                <article
                  key={project.title}
                  className="group relative h-[198px] overflow-hidden rounded-xl border border-slate-200/70 bg-white/28 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/40"
                >
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full w-full flex-col p-3 text-left sm:p-3.5"
                  >
                    <div className="absolute left-1.5 top-0 h-1 w-8 -translate-y-[1px] rounded-b-md border-x border-b border-slate-300/60 bg-white/40"></div>

                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="flex-1 text-[12px] font-semibold uppercase tracking-[0.07em] leading-tight text-slate-700 sm:text-[13px]">
                        {project.title}
                      </h3>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-white/50 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.12em] text-slate-500 sm:text-[9px]">
                        {project.year}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col border-t border-slate-200/60 pt-2">
                      <p className="text-[12px] leading-snug line-clamp-2 text-slate-600 sm:text-[13px]">{project.desc}</p>
                      <p className="mt-1.5 text-[11px] text-slate-500 line-clamp-1 sm:text-[12px]">
                        <span className="font-medium">Stack:</span> {project.stack}
                      </p>
                      <p className="mt-auto flex items-center gap-1 pt-1 text-[10px] italic tracking-[0.14em] text-slate-400 transition-colors group-hover:text-slate-600 sm:text-[11px]">
                        Visit &gt;
                      </p>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section id="skills" className="min-h-auto py-8 sm:py-10 lg:py-12">
            <SectionHeading subtitle="03 / Capability" title="Capabilities + Trajectory" />
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:mb-5 sm:text-[15px]">
              I operate as a vibe coder with a systems mindset, using code as a medium for speed, clarity, and product direction.
            </p>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <article className="rounded-2xl border border-white/75 bg-white/30 p-5 backdrop-blur-md lg:col-span-5 lg:p-6">
                <div className="mb-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">Trajectory</div>
                <div className="space-y-3">
                  {[
                    {
                      year: "2019 - 2023",
                      title: "Entrepreneurial Attempts",
                      detail: "Tested multiple offline and online business models and built strong failure-analysis discipline.",
                    },
                    {
                      year: "2023 - 2026",
                      title: "Bootstrapped Brand Operator",
                      detail: "Ran EIGHTY6TH with tighter loops across production, inventory, and marketplace feedback.",
                    },
                    {
                      year: "2026 - Present",
                      title: "AI/ML Reconstruction",
                      detail: "Applying entrepreneurial pattern recognition to product systems, interfaces, and AI workflows.",
                    },
                  ].map((phase, idx) => (
                    <div key={phase.year} className="relative rounded-xl border border-white/80 bg-white/40 p-3.5">
                      {idx < 2 && <div className="pointer-events-none absolute -bottom-3 left-4 h-3 w-px bg-slate-300/70"></div>}
                      <div className="mb-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">{phase.year}</div>
                      <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-800">{phase.title}</h4>
                      <p className="mt-1.5 text-[13px] leading-snug text-slate-600">{phase.detail}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-white/75 bg-white/30 p-5 backdrop-blur-md lg:col-span-7 lg:p-6">
                <div className="mb-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">Capability Architecture</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      title: "Strategy",
                      detail: "Entrepreneurship, Systems Thinking, Execution Under Constraint",
                    },
                    {
                      title: "Operations",
                      detail: "E-commerce Operations, Product Experimentation, Critical Iteration",
                    },
                    {
                      title: "Technology",
                      detail: "AI/ML Learning, UI Architecture, React/Tailwind Prototyping",
                    },
                    {
                      title: "Working Mode",
                      detail: "Hypothesis-first, fast iteration loops, and data-led decision refinement",
                    },
                  ].map((group) => (
                    <div key={group.title} className="rounded-xl border border-white/80 bg-white/40 p-3.5">
                      <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-800">{group.title}</h4>
                      <p className="mt-1.5 text-[13px] leading-snug text-slate-600">{group.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-white/80 bg-white/40 p-3.5">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Execution Signals</div>
                  <div className="flex flex-wrap gap-2 text-[12px] text-slate-600">
                    {[
                      "Fast test cycles",
                      "Constraint-led decisions",
                      "Interface clarity",
                      "Systemized learning",
                    ].map((signal) => (
                      <span key={signal} className="rounded-full border border-slate-200/80 bg-white/55 px-2.5 py-1">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section id="contact" className="flex min-h-auto flex-col items-center justify-center py-12 text-center sm:py-16 lg:py-20">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/75 bg-white/36 shadow-inner backdrop-blur-xl">
              <Mail className="text-slate-700" size={24} />
            </div>
            <h2 className="mb-4 text-2xl font-light tracking-tight text-slate-900 sm:mb-5 sm:text-3xl lg:mb-6 lg:text-5xl">Initiate Connection</h2>
            <p className="mb-8 max-w-sm px-2 font-light text-slate-600 sm:mb-10 sm:max-w-md sm:px-0 lg:mb-12">
              Open to conversations around technology, systems, and meaningful collaboration.
            </p>

            <GlassButton onClick={() => (window.location.href = "mailto:hello@example.com")} className="px-8 py-4 text-lg">
              Transmit Message
            </GlassButton>

            <div className="mt-16 flex gap-4 text-xs tracking-wide text-slate-500 sm:gap-6 sm:text-sm sm:tracking-wider lg:mt-24">
              <a
                href="https://in.linkedin.com/in/fayas-p-sulfikkar-28602520a"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-slate-900"
              >
                LINKEDIN
              </a>
              <a
                href="https://fayaspsulfikkar.github.io/self-log/"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-slate-900"
              >
                SELF-LOG
              </a>
            </div>
          </section>
        </div>
      </div>

      {selectedBusiness && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-3 sm:p-5 lg:p-8">
          <button
            type="button"
            aria-label="Close business details"
            onClick={() => setExpandedBusiness(null)}
            className="absolute inset-0 bg-white/12 backdrop-blur-md"
            style={{ animation: "blurIn 260ms ease-out" }}
          />

          <article
            className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-white/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.68),_0_14px_26px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:max-w-4xl sm:p-5 lg:p-6 ${getBusinessTone(selectedBusiness.state).cardBorder}`}
            style={{ animation: "windowIn 380ms cubic-bezier(0.2,0.8,0.22,1)" }}
          >
            <div
              className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-60"
              style={{ animation: "liquidFlow 1200ms ease-out" }}
            />

            <div className="relative z-10 mb-3 flex items-center justify-between gap-2 sm:mb-4 sm:gap-3">
              <button
                type="button"
                onClick={() => setExpandedBusiness(null)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] transition-colors backdrop-blur-md sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.14em] ${getBusinessTone(selectedBusiness.state).badge}`}
              >
                <ArrowLeft size={12} />
                Back
              </button>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] backdrop-blur-md ${getBusinessTone(selectedBusiness.state).badge}`}>
                {selectedBusiness.period}
              </span>
            </div>

            <div className={`relative z-10 mb-4 border-b pb-4 ${getBusinessTone(selectedBusiness.state).line}`}>
              <h3 className={`text-xl font-semibold uppercase tracking-[0.08em] ${getBusinessTone(selectedBusiness.state).heading}`}>
                {selectedBusiness.name}
              </h3>
              <p className={`mt-2 text-sm leading-relaxed ${getBusinessTone(selectedBusiness.state).body}`}>{selectedBusiness.detail}</p>
              <p className={`mt-1 text-sm ${getBusinessTone(selectedBusiness.state).bodyStrong}`}>
                <span className="font-medium">Outcome:</span> {selectedBusiness.outcome}
              </p>
            </div>

            <div className="relative z-10 grid gap-2 grid-cols-1 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className={`rounded-lg border p-3 backdrop-blur-sm ${getBusinessTone(selectedBusiness.state).panel}`}>
                <div className={`mb-1 text-[10px] uppercase tracking-[0.14em] ${getBusinessTone(selectedBusiness.state).meta}`}>Context</div>
                <p className={`text-sm leading-relaxed ${getBusinessTone(selectedBusiness.state).bodyStrong}`}>{selectedBusiness.context}</p>
              </div>
              <div className={`rounded-lg border p-3 backdrop-blur-sm ${getBusinessTone(selectedBusiness.state).panel}`}>
                <div className={`mb-1 text-[10px] uppercase tracking-[0.14em] ${getBusinessTone(selectedBusiness.state).meta}`}>Failure Signal</div>
                <p className={`text-sm leading-relaxed ${getBusinessTone(selectedBusiness.state).bodyStrong}`}>{selectedBusiness.failureSignal}</p>
              </div>
              <div className={`rounded-lg border p-3 backdrop-blur-sm ${getBusinessTone(selectedBusiness.state).panel}`}>
                <div className={`mb-1 text-[10px] uppercase tracking-[0.14em] ${getBusinessTone(selectedBusiness.state).meta}`}>Key Learning</div>
                <p className={`text-sm leading-relaxed ${getBusinessTone(selectedBusiness.state).bodyStrong}`}>{selectedBusiness.learning}</p>
              </div>
            </div>
          </article>
        </div>
      )}

      {hasScrolled && (
        <div className="fixed bottom-8 right-8 z-50 lg:hidden">
          <GlassButton
            icon={ArrowUp}
            onClick={() => scrollTo("home")}
            className="h-14 w-14 !rounded-full !px-0"
            aria-label="Scroll to top"
          />
        </div>
      )}
    </div>
  );
}
