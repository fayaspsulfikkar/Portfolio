import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Mail,
  ArrowUpRight,
  ArrowUp,
  ArrowLeft,
  Github,
  Linkedin,
  ExternalLink,
  ChevronDown,
  Camera,
  Box,
} from "lucide-react";
import GitHubProfile from "./GitHubProfile";

/* ─────────────────────────────────────────────
   TESSERACT  (unchanged math, reskinned visuals)
───────────────────────────────────────────── */
const TESSERACT_VERTICES = Array.from({ length: 16 }, (_, index) => [
  index & 1 ? 1 : -1,
  index & 2 ? 1 : -1,
  index & 4 ? 1 : -1,
  index & 8 ? 1 : -1,
]);

const TESSERACT_EDGES = [];
for (let from = 0; from < 16; from++) {
  for (let axis = 0; axis < 4; axis++) {
    const to = from ^ (1 << axis);
    if (from < to) TESSERACT_EDGES.push([from, to]);
  }
}

function rotatePair(a, b, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [a * c - b * s, a * s + b * c];
}

function projectVertex(vertex, angle) {
  let [x, y, z, w] = vertex;
  [x, w] = rotatePair(x, w, angle * 0.92);
  [y, z] = rotatePair(y, z, angle * 0.66);
  [x, z] = rotatePair(x, z, angle * 0.47);
  [y, w] = rotatePair(y, w, angle * 0.38);
  [z, w] = rotatePair(z, w, angle * 0.58);
  const wp = 1 / (2.7 - w * 0.85);
  const x3 = x * wp, y3 = y * wp, z3 = z * wp;
  const depth = 1 / (3.8 - z3 * 1.35);
  return { x: x3 * depth, y: y3 * depth, z: z3, glow: depth };
}

const TesseractProjection = () => {
  const frameRef = useRef(0);
  const [angle, setAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let rafId = 0, prev = 0;
    const step = (t) => {
      if (!prev) prev = t;
      frameRef.current += (t - prev) * (isHovered ? 0.0012 : 0.00062);
      prev = t;
      setAngle(frameRef.current);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isHovered]);

  const projected = useMemo(() => {
    const scale = 130;
    return TESSERACT_VERTICES.map((v) => {
      const p = projectVertex(v, angle);
      return { x: p.x * scale, y: p.y * scale, z: p.z, glow: p.glow };
    });
  }, [angle]);

  const sortedEdges = useMemo(() =>
    [...TESSERACT_EDGES].sort((a, b) =>
      (projected[a[0]].z + projected[a[1]].z) / 2 -
      (projected[b[0]].z + projected[b[1]].z) / 2
    ), [projected]);

  return (
    <div
      className="relative"
      style={{ width: 320, height: 320 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Red ambient glow behind */}
      <div
        style={{
          position: "absolute",
          inset: "20%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,57,43,0.18) 0%, transparent 70%)",
          filter: "blur(24px)",
          animation: "redGlow 3s ease-in-out infinite",
        }}
      />

      <svg viewBox="-160 -160 320 320" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <filter id="tesseractGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {sortedEdges.map(([from, to]) => {
          const s = projected[from], e = projected[to];
          const depth = (s.glow + e.glow) / 2;
          const opacity = 0.2 + depth * 0.8;
          const width = 0.8 + depth * 2.2;
          // deeper = more red, shallower = white
          const r = Math.round(192 * depth + 80 * (1 - depth));
          const g = Math.round(57 * depth + 80 * (1 - depth));
          const b = Math.round(43 * depth + 80 * (1 - depth));
          return (
            <line
              key={`${from}-${to}`}
              x1={s.x} y1={s.y} x2={e.x} y2={e.y}
              stroke={`rgba(${r},${g},${b},${opacity})`}
              strokeWidth={width}
              strokeLinecap="round"
              filter="url(#tesseractGlow)"
            />
          );
        })}

        {projected
          .map((p, i) => ({ ...p, i }))
          .sort((a, b) => a.z - b.z)
          .map(({ x, y, glow, i }) => {
            const r = 1.2 + glow * 2.5;
            const opacity = 0.4 + glow * 0.7;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={r * 2.4} fill={`rgba(192,57,43,${opacity * 0.15})`} />
                <circle cx={x} cy={y} r={r} fill={`rgba(220,100,80,${opacity})`} />
              </g>
            );
          })}
      </svg>
    </div>
  );
};

/* ─────────────────────────────────────────────
   HERO VISUAL (3D Interactive Portrait & 4D Tesseract)
───────────────────────────────────────────── */
const HeroVisual = ({ activeSection = "home" }) => {
  const [mode, setMode] = useState("portrait"); // "portrait" | "tesseract"
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const rotateY = (x - 0.5) * 18;
    const rotateX = -(y - 0.5) * 18;
    setTilt({
      rotateX,
      rotateY,
      glareX: x * 100,
      glareY: y * 100,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
      }}
      className="reveal-scale items-center"
    >
      {/* Mode Switcher */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: 4,
          background: "rgba(17,17,17,0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 999,
          backdropFilter: "blur(12px)",
          zIndex: 20,
        }}
      >
        <button
          type="button"
          onClick={() => setMode("portrait")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 999,
            border: mode === "portrait" ? "1px solid rgba(192,57,43,0.5)" : "1px solid transparent",
            background: mode === "portrait" ? "rgba(192,57,43,0.18)" : "transparent",
            color: mode === "portrait" ? "#f0ece8" : "rgba(240,236,232,0.45)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          <Camera size={12} color={mode === "portrait" ? "var(--red)" : "currentColor"} />
          Portrait
        </button>

        <button
          type="button"
          onClick={() => setMode("tesseract")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 999,
            border: mode === "tesseract" ? "1px solid rgba(192,57,43,0.5)" : "1px solid transparent",
            background: mode === "tesseract" ? "rgba(192,57,43,0.18)" : "transparent",
            color: mode === "tesseract" ? "#f0ece8" : "rgba(240,236,232,0.45)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          <Box size={12} color={mode === "tesseract" ? "var(--red)" : "currentColor"} />
          4D Tesseract
        </button>
      </div>

      {/* Main Visual Display */}
      {mode === "portrait" ? (
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "relative",
            width: 300,
            maxWidth: "88vw",
            height: 420,
            perspective: 1000,
            cursor: "crosshair",
          }}
        >
          {/* 3D Tilted Card Container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: 20,
              overflow: "hidden",
              background: "linear-gradient(160deg, #151515 0%, #0c0c0c 100%)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: isHovered
                ? "0 24px 60px rgba(0,0,0,0.85), 0 0 40px rgba(192,57,43,0.25)"
                : "0 16px 40px rgba(0,0,0,0.65), 0 0 24px rgba(192,57,43,0.12)",
              transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${
                isHovered ? 1.02 : 1
              }, ${isHovered ? 1.02 : 1}, 1)`,
              transition: isHovered
                ? "transform 0.08s ease-out, box-shadow 0.3s ease"
                : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Background Grid Pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: "24px 24px",
                pointerEvents: "none",
                opacity: 0.7,
              }}
            />

            {/* Pulsing Crimson Backlight Halo behind head & shoulders */}
            <div
              style={{
                position: "absolute",
                top: "12%",
                left: "12%",
                right: "12%",
                height: 250,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(192,57,43,0.6) 0%, rgba(192,57,43,0.2) 48%, transparent 75%)",
                filter: "blur(32px)",
                animation: "auraPulse 4s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />

            {/* Tactical Reticle Corners */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                width: 14,
                height: 14,
                borderTop: "2px solid var(--red)",
                borderLeft: "2px solid var(--red)",
                animation: "reticlePulse 3s ease-in-out infinite",
                zIndex: 15,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 14,
                height: 14,
                borderTop: "2px solid var(--red)",
                borderRight: "2px solid var(--red)",
                animation: "reticlePulse 3s ease-in-out infinite",
                zIndex: 15,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                width: 14,
                height: 14,
                borderBottom: "2px solid var(--red)",
                borderLeft: "2px solid var(--red)",
                animation: "reticlePulse 3s ease-in-out infinite",
                zIndex: 15,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                width: 14,
                height: 14,
                borderBottom: "2px solid var(--red)",
                borderRight: "2px solid var(--red)",
                animation: "reticlePulse 3s ease-in-out infinite",
                zIndex: 15,
                pointerEvents: "none",
              }}
            />

            {/* Top HUD Telemetry */}
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 18,
                right: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 15,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#f0ece8",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--red)",
                    boxShadow: "0 0 8px var(--red)",
                    animation: "redGlow 1.8s ease-in-out infinite",
                  }}
                />
                OPERATOR // {activeSection.toUpperCase()}
              </div>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  color: "rgba(240,236,232,0.35)",
                }}
              >
                FPS.013
              </div>
            </div>

            {/* Cutout Portrait Image with 3D Depth */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                transform: "translateZ(26px)",
                pointerEvents: "none",
              }}
            >
              <img
                src="/fayas.png"
                alt="Fayas P Sulfikkar"
                style={{
                  width: "100%",
                  height: "94%",
                  objectFit: "contain",
                  objectPosition: "bottom center",
                  filter: isHovered
                    ? "contrast(1.1) brightness(1.04) drop-shadow(0 14px 28px rgba(0,0,0,0.85))"
                    : "contrast(1.06) brightness(1.01) drop-shadow(0 10px 20px rgba(0,0,0,0.75))",
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 74%, rgba(0,0,0,0) 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 74%, rgba(0,0,0,0) 100%)",
                  transition: "filter 0.3s ease",
                }}
              />
            </div>

            {/* Laser Biometric Scan Beam */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 1,
                background: "linear-gradient(90deg, transparent 0%, rgba(231,76,60,0.95) 50%, transparent 100%)",
                boxShadow: "0 0 12px 1px rgba(231,76,60,0.85)",
                animation: "laserScan 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                pointerEvents: "none",
                zIndex: 12,
              }}
            />

            {/* Interactive Cursor Glare Highlight */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(231,76,60,0.18) 0%, transparent 60%)`,
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.3s ease",
                pointerEvents: "none",
                zIndex: 14,
              }}
            />

            {/* Bottom HUD Overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                right: 16,
                zIndex: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(192,57,43,0.85)",
                    marginBottom: 2,
                  }}
                >
                  EXTRACTED EXP.
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#f0ece8",
                  }}
                >
                  Fayas P Sulfikkar
                </div>
              </div>

              {/* Miniature 4D Tesseract Shortcut Pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("tesseract");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 8px",
                  borderRadius: 6,
                  background: "rgba(192,57,43,0.18)",
                  border: "1px solid rgba(192,57,43,0.4)",
                  color: "#f0ece8",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(192,57,43,0.35)";
                  e.currentTarget.style.borderColor = "var(--red)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(192,57,43,0.18)";
                  e.currentTarget.style.borderColor = "rgba(192,57,43,0.4)";
                }}
                title="Switch to 4D Tesseract projection"
              >
                <Box size={10} color="var(--red)" />
                4D ENGINE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            width: 300,
            maxWidth: "88vw",
            height: 420,
            borderRadius: 20,
            background: "linear-gradient(160deg, #151515 0%, #0c0c0c 100%)",
            border: "1px solid rgba(192,57,43,0.35)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(192,57,43,0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Tactical Reticle Corners */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              width: 14,
              height: 14,
              borderTop: "2px solid var(--red)",
              borderLeft: "2px solid var(--red)",
              zIndex: 15,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 14,
              height: 14,
              borderTop: "2px solid var(--red)",
              borderRight: "2px solid var(--red)",
              zIndex: 15,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              width: 14,
              height: 14,
              borderBottom: "2px solid var(--red)",
              borderLeft: "2px solid var(--red)",
              zIndex: 15,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              width: 14,
              height: 14,
              borderBottom: "2px solid var(--red)",
              borderRight: "2px solid var(--red)",
              zIndex: 15,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 16,
              left: 18,
              right: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 15,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--red)",
              }}
            >
              4D HYPERCUBE // SIMULATION
            </div>
            <button
              type="button"
              onClick={() => setMode("portrait")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "3px 8px",
                color: "rgba(240,236,232,0.6)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              ← Photo
            </button>
          </div>

          <TesseractProjection />

          <div
            style={{
              position: "absolute",
              bottom: 16,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(240,236,232,0.3)",
            }}
          >
            4-AXIS ROTATION · INTERACTIVE DEPTH
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   HOOK: scroll reveal
───────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .reveal-left, .reveal-scale");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────
   NAV RAIL
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: "home", label: "Home", num: "01" },
  { id: "businesses", label: "Businesses", num: "02" },
  { id: "portfolio", label: "Portfolio", num: "03" },
  { id: "skills", label: "Capabilities", num: "04" },
  { id: "contact", label: "Contact", num: "05" },
];

const NavRail = ({ active }) => {
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav
      style={{
        position: "fixed",
        left: 24,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "16px 8px",
        background: "rgba(17,17,17,0.85)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        backdropFilter: "blur(16px)",
      }}
      className="hidden lg:flex"
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(192,57,43,0.7)",
          marginBottom: 8,
          paddingInline: 8,
        }}
      >
        NAV
      </div>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              padding: "8px 10px",
              borderRadius: 10,
              border: isActive ? "1px solid rgba(192,57,43,0.4)" : "1px solid transparent",
              background: isActive ? "rgba(192,57,43,0.1)" : "transparent",
              cursor: "pointer",
              transition: "all 0.3s ease",
              minWidth: 140,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.border = "1px solid transparent";
              }
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isActive ? "#f0ece8" : "rgba(240,236,232,0.4)",
                fontWeight: isActive ? 500 : 300,
                transition: "color 0.3s",
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: isActive ? "rgba(192,57,43,0.8)" : "rgba(240,236,232,0.2)",
                transition: "color 0.3s",
              }}
            >
              {item.num}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

/* ─────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────── */
const SectionHeading = ({ index, title, subtitle }) => (
  <div className="section-divider reveal">
    <div>
      <div className="mono-tag" style={{ marginBottom: 8 }}>
        {index} — {subtitle}
      </div>
      <h2
        className="font-display"
        style={{
          fontSize: "clamp(2rem, 3.8vw, 3rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          color: "#f0ece8",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   RED BUTTON
───────────────────────────────────────────── */
const RedButton = ({ children, onClick, href, style = {}, icon: Icon }) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "var(--red)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
    ...style,
  };

  const content = (
    <>
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
      {Icon && <Icon size={16} style={{ position: "relative", zIndex: 1 }} />}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "60%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
          skewX: "-20deg",
          animation: "none",
        }}
        className="btn-shine"
      />
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        style={base}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--red-bright)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(192,57,43,0.4)";
          const shine = e.currentTarget.querySelector(".btn-shine");
          if (shine) shine.style.animation = "liquidShine 0.6s ease";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--red)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
          const shine = e.currentTarget.querySelector(".btn-shine");
          if (shine) shine.style.animation = "none";
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--red-bright)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(192,57,43,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--red)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {content}
    </button>
  );
};

/* ─────────────────────────────────────────────
   GHOST BUTTON
───────────────────────────────────────────── */
const GhostButton = ({ children, onClick, href, icon: Icon, style = {} }) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 22px",
    background: "transparent",
    color: "rgba(240,236,232,0.75)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 8,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.3s ease",
    ...style,
  };

  const content = (
    <>
      {children}
      {Icon && <Icon size={15} />}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        style={base}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(192,57,43,0.5)";
          e.currentTarget.style.color = "#f0ece8";
          e.currentTarget.style.background = "rgba(192,57,43,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
          e.currentTarget.style.color = "rgba(240,236,232,0.75)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(192,57,43,0.5)";
        e.currentTarget.style.color = "#f0ece8";
        e.currentTarget.style.background = "rgba(192,57,43,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
        e.currentTarget.style.color = "rgba(240,236,232,0.75)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      {content}
    </button>
  );
};

/* ─────────────────────────────────────────────
   BUSINESS DATA
───────────────────────────────────────────── */
const businessExperiments = [
  {
    name: "Drinking Water Blob",
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
    period: "2019–2020",
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
    detail: "Launched using rebuilt savings; operated ~6 months.",
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
    period: "2023–2026",
    state: "failure",
    detail: "Bootstrapped brand across production, marketplaces, and own website.",
    outcome: "Shutdown after capital drain; strong lessons in distribution.",
    context: "Built product and brand quality iteratively, but lacked sustained marketing runway.",
    failureSignal: "Traction gap despite prolonged build cycles.",
    learning: "Distribution design must be solved as early as product design.",
  },
];

/* ─────────────────────────────────────────────
   BUSINESS CARD
───────────────────────────────────────────── */
const BusinessCard = ({ business, onClick }) => {
  const isSuccess = business.state === "success";
  return (
    <article
      className={`dark-card ${isSuccess ? "success-card" : "failure-card"}`}
      style={{ cursor: "pointer", overflow: "hidden", position: "relative" }}
      onClick={() => onClick(business.name)}
    >
      {/* Top tab */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 16,
          width: 32,
          height: 3,
          background: isSuccess ? "#4ade80" : "var(--red)",
          borderRadius: "0 0 4px 4px",
          boxShadow: isSuccess
            ? "0 0 8px rgba(74,222,128,0.4)"
            : "0 0 8px rgba(192,57,43,0.4)",
        }}
      />

      <div style={{ padding: "20px 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <h3
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isSuccess ? "#4ade80" : "#e57370",
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {business.name}
          </h3>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: isSuccess ? "rgba(74,222,128,0.6)" : "rgba(192,57,43,0.6)",
              letterSpacing: "0.1em",
              marginLeft: 8,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {business.period}
          </span>
        </div>

        <div style={{ borderTop: `1px solid ${isSuccess ? "rgba(74,222,128,0.1)" : "rgba(192,57,43,0.1)"}`, paddingTop: 10 }}>
          <p style={{ fontSize: 12, color: "rgba(240,236,232,0.6)", lineHeight: 1.5, marginBottom: 6 }}>
            {business.detail}
          </p>
          <p style={{ fontSize: 11, color: "rgba(240,236,232,0.4)", lineHeight: 1.4 }}>
            <span style={{ color: isSuccess ? "rgba(74,222,128,0.7)" : "rgba(192,57,43,0.7)", fontWeight: 500 }}>
              Outcome:{" "}
            </span>
            {business.outcome}
          </p>
          <p
            style={{
              marginTop: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "rgba(240,236,232,0.25)",
              textTransform: "uppercase",
            }}
          >
            Click to open →
          </p>
        </div>
      </div>
    </article>
  );
};

/* ─────────────────────────────────────────────
   BUSINESS MODAL
───────────────────────────────────────────── */
const BusinessModal = ({ business, onClose }) => {
  if (!business) return null;
  const isSuccess = business.state === "success";
  const accent = isSuccess ? "#4ade80" : "var(--red)";
  const accentDim = isSuccess ? "rgba(74,222,128,0.1)" : "rgba(192,57,43,0.1)";
  const accentBorder = isSuccess ? "rgba(74,222,128,0.25)" : "rgba(192,57,43,0.25)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "grid",
        placeItems: "center",
        padding: "16px",
        animation: "blurIn 0.26s ease",
      }}
    >
      {/* Backdrop */}
      <button
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
          border: "none",
          cursor: "pointer",
        }}
        onClick={onClose}
        aria-label="Close"
      />

      <article
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 680,
          background: "var(--charcoal-2)",
          border: `1px solid ${accentBorder}`,
          borderRadius: 16,
          overflow: "hidden",
          animation: "windowIn 0.38s cubic-bezier(0.2,0.8,0.22,1)",
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${isSuccess ? "rgba(74,222,128,0.08)" : "rgba(192,57,43,0.1)"}`,
        }}
      >
        {/* Liquid shine on enter */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "50%",
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
            animation: "liquidFlow 1s ease-out",
            pointerEvents: "none",
          }}
        />

        <div style={{ padding: "24px 24px 20px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: accentDim,
                border: `1px solid ${accentBorder}`,
                borderRadius: 999,
                color: accent,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={12} />
              Back
            </button>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "rgba(240,236,232,0.3)",
              }}
            >
              {business.period}
            </span>
          </div>

          {/* Title */}
          <div style={{ borderBottom: `1px solid ${accentBorder}`, paddingBottom: 20, marginBottom: 20 }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: accent,
                marginBottom: 8,
              }}
            >
              {business.state === "success" ? "✓ Success" : "✗ Failure"}
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.6rem", fontWeight: 700, color: "#f0ece8", letterSpacing: "-0.01em" }}
            >
              {business.name}
            </h3>
            <p style={{ marginTop: 10, fontSize: 14, color: "rgba(240,236,232,0.6)", lineHeight: 1.6 }}>
              {business.detail}
            </p>
            <p style={{ marginTop: 6, fontSize: 13, color: "rgba(240,236,232,0.5)" }}>
              <span style={{ color: accent, fontWeight: 500 }}>Outcome: </span>
              {business.outcome}
            </p>
          </div>

          {/* Detail panels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { label: "Context", value: business.context },
              { label: "Failure Signal", value: business.failureSignal },
              { label: "Key Learning", value: business.learning },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: 14,
                  background: accentDim,
                  border: `1px solid ${accentBorder}`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: accent,
                    marginBottom: 8,
                  }}
                >
                  {label}
                </div>
                <p style={{ fontSize: 13, color: "rgba(240,236,232,0.75)", lineHeight: 1.55 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PORTFOLIO PROJECTS
───────────────────────────────────────────── */
const projects = [
  {
    title: "Cerebrum App",
    desc: "Advanced web platform analyzing human cognitive responses to video using Meta's TRIBE v2 multimodal brain encoding AI. Predicts fMRI-like activity from standard video files.",
    stack: ["AI", "Web", "Research"],
    highlight: true,
    actions: [
      { label: "GitHub", url: "https://github.com/fayaspsulfikkar/cerebrum-app" },
      { label: "Paper", url: "https://fayaspsulfikkar.github.io/crbrm_rsrch_ppr/" },
    ],
  },
  {
    title: "NASA-like 3D Solar System",
    desc: "A space-style 3D solar system inspired by NASA visuals, with smooth motion and interactive planets.",
    stack: ["JavaScript", "3D"],
    url: "https://interactive-universe-five.vercel.app/",
  },
  {
    title: "Simple Money Planner",
    desc: "A clean budgeting page to plan income and expenses with an easy-to-understand layout.",
    stack: ["HTML", "CSS"],
    url: "https://fayaspsulfikkar.github.io/money-pro/",
  },
  {
    title: "Daily Expense Tracker",
    desc: "A lightweight tracker to record daily spending and quickly check your money flow.",
    stack: ["JavaScript"],
    url: "https://money-pulse-bay.vercel.app/",
  },
  {
    title: "Personal System Log",
    desc: "A timeline of my real startup journey — failures, lessons, and rebuild phases, documented publicly.",
    stack: ["HTML"],
    url: "https://fayaspsulfikkar.github.io/self-log/",
  },
];

const ProjectCard = ({ project }) => {
  return (
    <article
      className="dark-card"
      style={{
        position: "relative",
        overflow: "hidden",
        height: 220,
        borderColor: project.highlight
          ? "rgba(192,57,43,0.4)"
          : "rgba(255,255,255,0.07)",
        boxShadow: project.highlight
          ? "0 0 30px rgba(192,57,43,0.12), inset 0 0 60px rgba(192,57,43,0.03)"
          : "none",
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 16,
          width: project.highlight ? 48 : 24,
          height: 2,
          background: project.highlight ? "var(--red)" : "rgba(255,255,255,0.15)",
          borderRadius: "0 0 2px 2px",
          boxShadow: project.highlight ? "0 0 10px rgba(192,57,43,0.6)" : "none",
        }}
      />

      {/* Clickable overlay */}
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
          aria-label={`Visit ${project.title}`}
        />
      )}

      <div style={{ padding: "20px 16px 14px", height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <h3
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: project.highlight ? "#e57370" : "#f0ece8",
              lineHeight: 1.3,
              flex: 1,
            }}
          >
            {project.title}
            {project.highlight && (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: 8,
                  fontSize: 9,
                  fontWeight: 400,
                  color: "rgba(192,57,43,0.6)",
                  letterSpacing: "0.14em",
                  textTransform: "lowercase",
                  fontStyle: "italic",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                research
              </span>
            )}
          </h3>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 12, color: "rgba(240,236,232,0.55)", lineHeight: 1.55, flex: 1 }}>
            {project.desc}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, marginBottom: 8 }}>
            {project.stack.map((s) => (
              <span
                key={s}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: project.highlight ? "rgba(192,57,43,0.7)" : "rgba(240,236,232,0.3)",
                  padding: "2px 8px",
                  border: `1px solid ${project.highlight ? "rgba(192,57,43,0.2)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 4,
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {project.actions ? (
            <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
              {project.actions.map((a) => (
                <a
                  key={a.label}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 12px",
                    background: "rgba(192,57,43,0.12)",
                    border: "1px solid rgba(192,57,43,0.3)",
                    borderRadius: 6,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#e57370",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(192,57,43,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(192,57,43,0.12)";
                  }}
                >
                  {a.label} <ArrowUpRight size={9} />
                </a>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(240,236,232,0.2)",
              }}
            >
              Visit →
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [hasScrolled, setHasScrolled] = useState(false);
  const [expandedBusiness, setExpandedBusiness] = useState(null);
  const scrollRef = useRef(null);

  useReveal();

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const sections = Array.from(document.querySelectorAll("section[id]"));
    let raf = 0;

    const update = () => {
      raf = 0;
      setHasScrolled(container.scrollTop > 8);
      const marker = container.scrollTop + container.clientHeight * 0.3;
      let curr = sections[0]?.id || "home";
      for (const s of sections) {
        if (s.offsetTop <= marker) curr = s.id;
        else break;
      }
      setActiveSection((prev) => (prev === curr ? prev : curr));
    };

    const req = () => { if (!raf) raf = requestAnimationFrame(update); };
    req();
    container.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      container.removeEventListener("scroll", req);
      window.removeEventListener("resize", req);
    };
  }, []);

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const selectedBusiness = businessExperiments.find((b) => b.name === expandedBusiness) ?? null;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--black)",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Ambient red glow top-right */}
      <div
        style={{
          position: "fixed",
          top: "-10%",
          right: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,57,43,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Ambient glow bottom-left */}
      <div
        style={{
          position: "fixed",
          bottom: "-10%",
          left: "10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,57,43,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* NAV RAIL */}
      <NavRail active={activeSection} />

      {/* FIXED RIGHT PHOTO CARD (Desktop) */}
      <aside
        aria-label="Operator Console"
        style={{
          position: "fixed",
          right: 28,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 40,
        }}
        className="hidden lg:flex flex-col items-center pointer-events-auto"
      >
        <HeroVisual activeSection={activeSection} />
      </aside>

      {/* Top bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          pointerEvents: "none",
        }}
        className="px-6 py-4"
      >
        <div className="w-full flex justify-between items-center">
          <div className="hidden lg:block w-[200px] xl:w-[220px] flex-shrink-0" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 20px",
              background: hasScrolled ? "rgba(10,10,10,0.92)" : "transparent",
              border: hasScrolled ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
              borderRadius: 12,
              backdropFilter: hasScrolled ? "blur(16px)" : "none",
              transition: "all 0.4s ease",
            }}
            className="flex-1 min-w-0 max-w-[820px] xl:max-w-[860px] mx-auto pointer-events-auto"
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(192,57,43,0.7)",
              }}
            >
              FPS
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "rgba(240,236,232,0.3)",
              }}
            >
              v2026 // {activeSection.toUpperCase()}
            </span>
          </div>
          <div className="hidden lg:block w-[340px] xl:w-[360px] flex-shrink-0" />
        </div>
      </div>

      {/* Bottom corner decorations */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(240,236,232,0.15)",
          lineHeight: 1.6,
          zIndex: 40,
        }}
        className="hidden sm:block"
      >
        Portfolio
        <br />System
        <br />vNext
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "rgba(240,236,232,0.15)",
          zIndex: 40,
        }}
      >
        013
      </div>

      {/* SCROLL CONTAINER */}
      <div
        ref={scrollRef}
        className="custom-scrollbar"
        style={{
          position: "relative",
          zIndex: 10,
          marginLeft: 0,
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          scrollBehavior: "smooth",
        }}
      >
        <div className="w-full flex justify-between min-h-screen">
          {/* Left Column Spacer: reserves width for fixed NavRail */}
          <div className="hidden lg:block w-[200px] xl:w-[220px] flex-shrink-0" />

          {/* Center Column: Perfectly centered in the remaining space */}
          <main className="flex-1 min-w-0 max-w-[820px] xl:max-w-[860px] mx-auto px-6 sm:px-10 py-12 pb-36">

            {/* ══ HOME ══ */}
            <section
              id="home"
              style={{
                minHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingTop: 40,
                paddingBottom: 60,
                position: "relative",
              }}
            >
              {/* Grid bg decoration */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `
                    linear-gradient(rgba(192,57,43,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(192,57,43,0.04) 1px, transparent 1px)
                  `,
                  backgroundSize: "60px 60px",
                  pointerEvents: "none",
                  maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }} className="w-full">
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--red)",
                    marginBottom: 16,
                  }}
                  className="reveal"
                >
                  Builder · Entrepreneur · AI/ML
                </div>

                <h1
                  className="font-display reveal"
                  style={{
                    fontSize: "clamp(2.6rem, 5.5vw, 4.5rem)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                    color: "#f0ece8",
                    marginBottom: 20,
                    transitionDelay: "80ms",
                  }}
                >
                  Fayas P<br />
                  <span
                    style={{
                      fontStyle: "italic",
                      color: "transparent",
                      WebkitTextStroke: "1px rgba(240,236,232,0.6)",
                    }}
                  >
                    Sulfikkar
                  </span>
                </h1>

                <p
                  style={{
                    fontSize: 15,
                    color: "rgba(240,236,232,0.6)",
                    lineHeight: 1.7,
                    maxWidth: 540,
                    marginBottom: 32,
                  }}
                  className="reveal"
                >
                  Not a highlight reel — a reconstruction interface. Every collapse became pattern recognition.
                  Starting from extracted experience.
                </p>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }} className="reveal">
                  <RedButton onClick={() => scrollTo("portfolio")} icon={ArrowUpRight}>
                    View Portfolio
                  </RedButton>
                  <GhostButton onClick={() => scrollTo("businesses")}>
                    Business Log
                  </GhostButton>
                </div>

                {/* Mobile photo card in flow (on desktop it is fixed on the right) */}
                <div className="mt-8 mb-6 flex justify-center lg:hidden">
                  <HeroVisual activeSection={activeSection} />
                </div>
              </div>

              {/* GitHub card */}
              <div
                className="reveal"
                style={{
                  marginTop: 16,
                  maxWidth: 620,
                  background: "var(--charcoal-2)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <GitHubProfile />
              </div>

            {/* Scroll hint */}
            <button
              type="button"
              onClick={() => scrollTo("businesses")}
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                animation: "scrollFloat 2s ease-in-out infinite",
                color: "rgba(240,236,232,0.3)",
              }}
              className="lg:hidden"
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Scroll
              </span>
              <ChevronDown size={14} />
            </button>
          </section>

          {/* ══ BUSINESSES ══ */}
          <section id="businesses" style={{ paddingTop: 80, paddingBottom: 80 }}>
            <SectionHeading index="01" subtitle="Ventures" title="Business" />

            <p
              style={{
                fontSize: 15,
                color: "rgba(240,236,232,0.45)",
                lineHeight: 1.7,
                maxWidth: 520,
                marginBottom: 48,
              }}
              className="reveal"
            >
              Six experiments across 7 years. Five failures, one success. Each documented as a system log — context, signal, and extracted learning.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}
              className="stagger"
            >
              {businessExperiments.map((b, i) => (
                <div key={b.name} className="reveal" style={{ transitionDelay: `${i * 60}ms` }}>
                  <BusinessCard business={b} onClick={setExpandedBusiness} />
                </div>
              ))}
            </div>
          </section>

          {/* ══ PORTFOLIO ══ */}
          <section id="portfolio" style={{ paddingTop: 80, paddingBottom: 80 }}>
            <SectionHeading index="02" subtitle="Works" title="Selected Works" />

            <p
              style={{
                fontSize: 15,
                color: "rgba(240,236,232,0.45)",
                lineHeight: 1.7,
                maxWidth: 520,
                marginBottom: 48,
              }}
              className="reveal"
            >
              Built through vibe coding: fast product intuition, rapid interface iteration, and execution-first refinement.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {projects.map((p, i) => (
                <div key={p.title} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                  <ProjectCard project={p} />
                </div>
              ))}
            </div>
          </section>

          {/* ══ SKILLS / CAPABILITIES ══ */}
          <section id="skills" style={{ paddingTop: 80, paddingBottom: 80 }}>
            <SectionHeading index="03" subtitle="Architecture" title="Capabilities" />

            <p
              style={{
                fontSize: 15,
                color: "rgba(240,236,232,0.45)",
                lineHeight: 1.7,
                maxWidth: 520,
                marginBottom: 48,
              }}
              className="reveal"
            >
              I operate as a vibe coder with a systems mindset — using code as a medium for speed, clarity, and product direction.
            </p>

            <div style={{ display: "grid", gap: 16 }} className="lg:grid-cols-12">

              {/* Trajectory timeline */}
              <div
                className="reveal dark-card lg:col-span-5"
                style={{ padding: 24 }}
              >
                <div className="mono-tag" style={{ marginBottom: 20 }}>Trajectory</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    {
                      year: "2019 – 2023",
                      title: "Entrepreneurial Attempts",
                      detail: "Tested multiple offline and online business models. Built strong failure-analysis discipline.",
                    },
                    {
                      year: "2023 – 2026",
                      title: "Bootstrapped Brand Operator",
                      detail: "Ran EIGHTY6TH with tighter loops across production, inventory, and marketplace feedback.",
                    },
                    {
                      year: "2026 – Present",
                      title: "AI/ML Reconstruction",
                      detail: "Applying entrepreneurial pattern recognition to product systems, interfaces, and AI workflows.",
                    },
                  ].map((phase, idx, arr) => (
                    <div key={phase.year} style={{ position: "relative", paddingLeft: 24, paddingBottom: idx < arr.length - 1 ? 24 : 0 }}>
                      {/* Vertical line */}
                      {idx < arr.length - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: 5,
                            top: 12,
                            bottom: 0,
                            width: 1,
                            background: "linear-gradient(to bottom, rgba(192,57,43,0.4), rgba(192,57,43,0.05))",
                          }}
                        />
                      )}
                      {/* Dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 6,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          border: "2px solid var(--red)",
                          background: idx === arr.length - 1 ? "var(--red)" : "var(--charcoal-2)",
                          boxShadow: idx === arr.length - 1 ? "0 0 8px rgba(192,57,43,0.5)" : "none",
                        }}
                      />
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 9,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "rgba(192,57,43,0.6)",
                          marginBottom: 4,
                        }}
                      >
                        {phase.year}
                      </div>
                      <h4
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "#f0ece8",
                          marginBottom: 4,
                        }}
                      >
                        {phase.title}
                      </h4>
                      <p style={{ fontSize: 13, color: "rgba(240,236,232,0.5)", lineHeight: 1.55 }}>
                        {phase.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capability groups */}
              <div className="reveal lg:col-span-7" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  className="dark-card"
                  style={{ padding: 24 }}
                >
                  <div className="mono-tag" style={{ marginBottom: 16 }}>Capability Architecture</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      {
                        title: "Strategy",
                        detail: "Entrepreneurship · Systems Thinking · Execution Under Constraint",
                      },
                      {
                        title: "Operations",
                        detail: "E-commerce · Product Experimentation · Critical Iteration",
                      },
                      {
                        title: "Technology",
                        detail: "AI/ML Learning · UI Architecture · React / Tailwind",
                      },
                      {
                        title: "Working Mode",
                        detail: "Hypothesis-first, fast iteration loops, data-led decision refinement",
                      },
                    ].map((g) => (
                      <div
                        key={g.title}
                        style={{
                          padding: "14px",
                          background: "var(--charcoal-3)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--red)",
                            marginBottom: 6,
                          }}
                        >
                          {g.title}
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(240,236,232,0.5)", lineHeight: 1.5 }}>
                          {g.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution signals */}
                <div
                  className="dark-card"
                  style={{ padding: "16px 20px" }}
                >
                  <div className="mono-tag" style={{ marginBottom: 12 }}>Execution Signals</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      "Fast test cycles",
                      "Constraint-led decisions",
                      "Interface clarity",
                      "Systemized learning",
                      "Post-failure diagnostics",
                      "Long-cycle thinking",
                    ].map((s) => (
                      <span
                        key={s}
                        style={{
                          padding: "5px 12px",
                          border: "1px solid rgba(192,57,43,0.2)",
                          borderRadius: 999,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          color: "rgba(240,236,232,0.5)",
                          background: "rgba(192,57,43,0.04)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══ CONTACT ══ */}
          <section
            id="contact"
            style={{
              paddingTop: 80,
              paddingBottom: 80,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div
              className="reveal-scale"
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "1px solid rgba(192,57,43,0.4)",
                background: "rgba(192,57,43,0.08)",
                display: "grid",
                placeItems: "center",
                marginBottom: 32,
                boxShadow: "0 0 32px rgba(192,57,43,0.12)",
              }}
            >
              <Mail size={28} color="var(--red)" />
            </div>

            <h2
              className="font-display reveal"
              style={{
                fontSize: "clamp(2.4rem, 6vw, 5rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: "#f0ece8",
                marginBottom: 20,
              }}
            >
              Initiate<br />
              <span style={{ fontStyle: "italic", color: "var(--red)" }}>Connection</span>
            </h2>

            <p
              className="reveal"
              style={{
                fontSize: 15,
                color: "rgba(240,236,232,0.45)",
                lineHeight: 1.7,
                maxWidth: 400,
                marginBottom: 40,
              }}
            >
              Open to conversations around technology, systems, and meaningful collaboration.
            </p>

            <div className="reveal" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 60 }}>
              <RedButton href="mailto:fayas@system" icon={Mail}>
                Send Message
              </RedButton>
              <GhostButton href="https://in.linkedin.com/in/fayas-p-sulfikkar-28602520a" icon={ExternalLink}>
                LinkedIn
              </GhostButton>
            </div>

            <div
              className="reveal"
              style={{
                display: "flex",
                gap: 32,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 40,
              }}
            >
              {[
                { label: "LinkedIn", href: "https://in.linkedin.com/in/fayas-p-sulfikkar-28602520a" },
                { label: "GitHub", href: "https://github.com/fayaspsulfikkar" },
                { label: "System Log", href: "https://fayaspsulfikkar.github.io/self-log/" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(240,236,232,0.3)",
                    textDecoration: "none",
                    transition: "color 0.3s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(240,236,232,0.3)"; }}
                >
                  {label}
                </a>
              ))}
            </div>
          </section>

          </main>

          {/* Right Column Spacer: reserves width for fixed HeroVisual */}
          <div className="hidden lg:block w-[340px] xl:w-[360px] flex-shrink-0" />
        </div>
      </div>

      {/* ── BUSINESS MODAL ── */}
      <BusinessModal
        business={selectedBusiness}
        onClose={() => setExpandedBusiness(null)}
      />

      {/* ── SCROLL TO TOP ── */}
      {hasScrolled && (
        <button
          onClick={() => scrollTo("home")}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "var(--red)",
            border: "none",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 4px 20px rgba(192,57,43,0.4)",
            transition: "all 0.3s ease",
          }}
          aria-label="Scroll to top"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--red-bright)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--red)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          className="lg:hidden"
        >
          <ArrowUp size={18} color="#fff" />
        </button>
      )}
    </div>
  );
}
