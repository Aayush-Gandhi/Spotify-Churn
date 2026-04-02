
import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend, ReferenceLine, ReferenceArea,
  Cell, LabelList,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════ */
const C = {
  active:      "#14b8a6",   // teal-500
  activeDark:  "#0d9488",   // teal-600
  activeLight: "#ccfbf1",   // teal-100
  churned:     "#f43f5e",   // rose-500
  churnedDark: "#e11d48",   // rose-600
  churnedLight:"#ffe4e6",   // rose-100
  neutral:     "#64748b",   // slate-500
  bg:          "#0f172a",   // slate-950
  surface:     "#1e293b",   // slate-800
  surfaceHigh: "#334155",   // slate-700
  border:      "#334155",
  text:        "#f1f5f9",   // slate-100
  textMuted:   "#94a3b8",   // slate-400
  textDim:     "#475569",   // slate-600
  accent:      "#818cf8",   // indigo-400
  warning:     "#fb923c",   // orange-400
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES  (injected once at mount)
   ═══════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${C.bg};
    color: ${C.text};
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* Scroll reveal animation - reversible on scroll */
  .reveal {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.55s ease, transform 0.55s ease;
    will-change: opacity, transform;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  /* Keep class names for compatibility, but remove artificial stagger so reveal is driven by scroll position */
  .reveal-delay-1 { transition-delay: 0s; }
  .reveal-delay-2 { transition-delay: 0s; }
  .reveal-delay-3 { transition-delay: 0s; }

  /* Recharts overrides */
  .recharts-tooltip-wrapper { outline: none; }
  .recharts-cartesian-axis-tick-value { fill: ${C.textMuted}; font-size: 12px; }
  .recharts-legend-item-text { color: ${C.textMuted} !important; font-size: 13px; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.surfaceHigh}; border-radius: 3px; }

  @media (max-width: 768px) {
    .two-col { flex-direction: column !important; }
    .stat-row { flex-direction: column !important; gap: 12px !important; }
  }
`;

/* ═══════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/** Scroll-reveal wrapper — reversible on scroll using IntersectionObserver */
function Reveal({ children, delay = 0, style = {}, threshold = 0.2 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const delayClass = delay === 1 ? "reveal-delay-1"
    : delay === 2 ? "reveal-delay-2"
    : delay === 3 ? "reveal-delay-3" : "";

  return (
    <div ref={ref} className={`reveal ${delayClass} ${visible ? "visible" : ""}`} style={style}>
      {children}
    </div>
  );
}

/** Section wrapper with consistent vertical rhythm */
function Section({ id, children, style = {} }) {
  return (
    <section
      id={id}
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "100px 24px 60px",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/** Eyebrow label above section titles */
function Eyebrow({ children, color = C.accent }) {
  return (
    <p style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color,
      marginBottom: 12,
    }}>
      {children}
    </p>
  );
}

/** Large editorial section heading */
function Heading({ children, style = {} }) {
  return (
    <h2 style={{
      fontFamily: "'DM Serif Display', serif",
      fontSize: "clamp(28px, 5vw, 44px)",
      fontWeight: 400,
      lineHeight: 1.15,
      color: C.text,
      marginBottom: 16,
      ...style,
    }}>
      {children}
    </h2>
  );
}

/** Body narrative text */
function Body({ children, style = {} }) {
  return (
    <p style={{
      fontSize: 16,
      lineHeight: 1.75,
      color: C.textMuted,
      maxWidth: 640,
      ...style,
    }}>
      {children}
    </p>
  );
}

/** Chart container card */
function ChartCard({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "28px 24px 20px",
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Chart caption */
function Caption({ children }) {
  return (
    <p style={{
      fontSize: 12,
      color: C.textDim,
      marginTop: 14,
      textAlign: "center",
      fontStyle: "italic",
    }}>
      {children}
    </p>
  );
}

/** Custom tooltip base */
function TooltipBox({ children }) {
  return (
    <div style={{
      background: C.surfaceHigh,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 13,
      color: C.text,
      lineHeight: 1.6,
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      {children}
    </div>
  );
}

/** Horizontal divider rule */
function Divider() {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, ${C.border} 20%, ${C.border} 80%, transparent)`,
      margin: "0 auto",
      maxWidth: 900,
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOM TOOLTIP COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const SubTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <strong>{label} users</strong><br />
      <span style={{ color: C.active }}>● Active: {payload[0]?.value?.toLocaleString()}</span><br />
      <span style={{ color: C.churned }}>● Churned: {payload[1]?.value?.toLocaleString()}</span><br />
      <span style={{ color: C.textMuted }}>
        Churn rate: {label === "Free" ? "35.2%" : "8.3%"}
      </span>
    </TooltipBox>
  );
};

const MetricTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <strong style={{ color: C.text }}>{label}</strong><br />
      {payload.map((p, i) => (
        <span key={i} style={{ color: p.color }}>
          ● {p.name}: {p.value}{p.name.includes("minutes") ? " min" : p.name.includes("days") ? " days" : ""}
          <br />
        </span>
      ))}
    </TooltipBox>
  );
};

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <TooltipBox>
      <span style={{ color: d.churned ? C.churned : C.active, fontWeight: 600 }}>
        {d.churned ? "Churned" : "Active"} user
      </span><br />
      <span style={{ color: C.textMuted }}>Type: </span>{d.sub}<br />
      <span style={{ color: C.textMuted }}>Daily listening: </span>{d.minutes} min<br />
      <span style={{ color: C.textMuted }}>Days since login: </span>{d.days}<br />
      <span style={{ color: C.textMuted }}>Playlists: </span>{d.playlists}
    </TooltipBox>
  );
};

const CountryTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const COUNTRY_NAMES = {
    AU:"Australia", DE:"Germany", US:"United States", CA:"Canada",
    IN:"India", FR:"France", BR:"Brazil", RU:"Russia", PK:"Pakistan", UK:"United Kingdom"
  };
  return (
    <TooltipBox>
      <strong>{COUNTRY_NAMES[label] || label}</strong><br />
      <span style={{ color: C.churned }}>Churn rate: {payload[0]?.value}%</span>
    </TooltipBox>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ── DATA LAYER ──
   Replace any of these constants with your real CSV-derived data.
   The comment above each shows the aggregation logic used.
   ═══════════════════════════════════════════════════════════════ */

/**
 * SOURCE: df.groupby('subscription_type').agg(total, churned, active)
 * Columns: subscription_type, active, churned, rate
 */
const SUBSCRIPTION_DATA = [
  { name: "Free",    active: 248, churned: 135, rate: 35.2 },
  { name: "Premium", active: 566, churned: 51,  rate: 8.3  },
];

/**
 * SOURCE: df.groupby('churned')[['avg_daily_minutes','days_since_last_login','number_of_playlists']].mean()
 * Rows: one for active (churned=0), one for churned (churned=1)
 */
const BEHAVIORAL_DATA = [
  {
    metric: "Avg daily listening",
    unit: "min",
    active: 103.3,
    churned: 71.9,
    note: "−30% less listening time",
  },
  {
    metric: "Days since last login",
    unit: "days",
    active: 8.8,
    churned: 12.4,
    note: "+41% longer gaps between sessions",
  },
  {
    metric: "Number of playlists",
    unit: "",
    active: 3.6,
    churned: 2.6,
    note: "−28% fewer playlists created",
  },
];

/**
 * SOURCE: df[['avg_daily_minutes','days_since_last_login','number_of_playlists','churned','subscription_type']]
 *         .sample(300, random_state=42)
 * Negative avg_daily_minutes values removed. Renamed to shorter keys.
 */
const SCATTER_DATA = [{"minutes":182.0,"days":8,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":80.7,"days":5,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":53.6,"days":0,"playlists":8,"churned":1,"sub":"Premium"},{"minutes":209.6,"days":18,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":158.4,"days":56,"playlists":0,"churned":0,"sub":"Premium"},{"minutes":197.7,"days":19,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":162.6,"days":3,"playlists":0,"churned":1,"sub":"Premium"},{"minutes":127.2,"days":8,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":103.7,"days":5,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":170.2,"days":1,"playlists":0,"churned":0,"sub":"Premium"},{"minutes":147.4,"days":4,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":109.5,"days":9,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":62.8,"days":2,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":143.7,"days":2,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":45.2,"days":11,"playlists":0,"churned":0,"sub":"Free"},{"minutes":121.7,"days":21,"playlists":0,"churned":1,"sub":"Free"},{"minutes":164.7,"days":9,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":137.1,"days":2,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":22.7,"days":5,"playlists":2,"churned":1,"sub":"Free"},{"minutes":54.3,"days":28,"playlists":2,"churned":0,"sub":"Free"},{"minutes":118.1,"days":7,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":115.6,"days":4,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":54.2,"days":27,"playlists":1,"churned":1,"sub":"Free"},{"minutes":22.6,"days":0,"playlists":5,"churned":0,"sub":"Free"},{"minutes":155.9,"days":1,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":140.3,"days":10,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":74.0,"days":7,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":39.3,"days":0,"playlists":1,"churned":1,"sub":"Free"},{"minutes":86.9,"days":11,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":34.2,"days":2,"playlists":1,"churned":1,"sub":"Free"},{"minutes":77.7,"days":5,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":93.6,"days":1,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":40.5,"days":3,"playlists":0,"churned":0,"sub":"Free"},{"minutes":30.4,"days":8,"playlists":1,"churned":0,"sub":"Free"},{"minutes":193.2,"days":12,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":55.8,"days":0,"playlists":3,"churned":1,"sub":"Free"},{"minutes":142.8,"days":0,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":95.3,"days":5,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":65.9,"days":10,"playlists":0,"churned":1,"sub":"Free"},{"minutes":169.2,"days":47,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":52.9,"days":7,"playlists":1,"churned":0,"sub":"Free"},{"minutes":55.5,"days":3,"playlists":2,"churned":0,"sub":"Free"},{"minutes":111.0,"days":9,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":153.5,"days":13,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":34.8,"days":5,"playlists":0,"churned":1,"sub":"Free"},{"minutes":44.5,"days":1,"playlists":1,"churned":0,"sub":"Free"},{"minutes":62.4,"days":0,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":33.1,"days":0,"playlists":3,"churned":1,"sub":"Free"},{"minutes":126.3,"days":34,"playlists":1,"churned":1,"sub":"Premium"},{"minutes":88.6,"days":13,"playlists":3,"churned":1,"sub":"Free"},{"minutes":55.2,"days":10,"playlists":0,"churned":0,"sub":"Free"},{"minutes":90.1,"days":7,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":169.7,"days":20,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":120.7,"days":14,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":72.8,"days":1,"playlists":4,"churned":0,"sub":"Free"},{"minutes":189.6,"days":1,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":65.7,"days":10,"playlists":2,"churned":0,"sub":"Free"},{"minutes":87.4,"days":13,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":141.0,"days":0,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":65.1,"days":6,"playlists":4,"churned":0,"sub":"Free"},{"minutes":49.0,"days":4,"playlists":2,"churned":0,"sub":"Free"},{"minutes":50.2,"days":3,"playlists":2,"churned":0,"sub":"Free"},{"minutes":35.2,"days":14,"playlists":0,"churned":0,"sub":"Free"},{"minutes":96.8,"days":11,"playlists":9,"churned":0,"sub":"Premium"},{"minutes":168.5,"days":22,"playlists":5,"churned":1,"sub":"Premium"},{"minutes":109.4,"days":0,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":133.1,"days":8,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":115.0,"days":1,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":102.0,"days":32,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":80.4,"days":4,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":135.2,"days":20,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":83.1,"days":2,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":91.0,"days":2,"playlists":0,"churned":0,"sub":"Free"},{"minutes":128.7,"days":3,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":123.7,"days":0,"playlists":4,"churned":0,"sub":"Free"},{"minutes":105.8,"days":10,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":188.2,"days":8,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":132.1,"days":9,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":125.3,"days":30,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":107.7,"days":0,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":74.9,"days":5,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":99.8,"days":8,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":112.9,"days":18,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":39.7,"days":0,"playlists":1,"churned":0,"sub":"Free"},{"minutes":120.4,"days":30,"playlists":3,"churned":1,"sub":"Premium"},{"minutes":44.5,"days":20,"playlists":4,"churned":1,"sub":"Free"},{"minutes":34.6,"days":4,"playlists":4,"churned":1,"sub":"Free"},{"minutes":69.1,"days":20,"playlists":0,"churned":0,"sub":"Free"},{"minutes":103.1,"days":17,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":40.5,"days":37,"playlists":4,"churned":0,"sub":"Free"},{"minutes":101.8,"days":4,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":135.1,"days":0,"playlists":8,"churned":0,"sub":"Premium"},{"minutes":139.5,"days":14,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":74.2,"days":0,"playlists":1,"churned":0,"sub":"Free"},{"minutes":60.9,"days":1,"playlists":0,"churned":1,"sub":"Free"},{"minutes":105.6,"days":14,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":127.6,"days":15,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":98.2,"days":10,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":58.8,"days":3,"playlists":3,"churned":0,"sub":"Free"},{"minutes":122.3,"days":7,"playlists":4,"churned":1,"sub":"Premium"},{"minutes":34.6,"days":2,"playlists":0,"churned":1,"sub":"Free"},{"minutes":121.3,"days":44,"playlists":1,"churned":0,"sub":"Free"},{"minutes":58.1,"days":1,"playlists":1,"churned":0,"sub":"Free"},{"minutes":33.1,"days":21,"playlists":0,"churned":1,"sub":"Free"},{"minutes":3.6,"days":1,"playlists":4,"churned":1,"sub":"Free"},{"minutes":110.8,"days":3,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":152.2,"days":5,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":33.1,"days":4,"playlists":1,"churned":1,"sub":"Free"},{"minutes":52.0,"days":2,"playlists":2,"churned":0,"sub":"Free"},{"minutes":39.7,"days":16,"playlists":1,"churned":1,"sub":"Free"},{"minutes":42.8,"days":7,"playlists":3,"churned":0,"sub":"Free"},{"minutes":102.5,"days":5,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":77.1,"days":15,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":100.9,"days":15,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":91.9,"days":12,"playlists":8,"churned":0,"sub":"Premium"},{"minutes":89.5,"days":1,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":92.9,"days":11,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":111.6,"days":13,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":118.8,"days":0,"playlists":1,"churned":0,"sub":"Free"},{"minutes":101.1,"days":6,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":206.1,"days":4,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":39.5,"days":1,"playlists":1,"churned":1,"sub":"Free"},{"minutes":47.6,"days":27,"playlists":5,"churned":1,"sub":"Free"},{"minutes":174.0,"days":2,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":136.8,"days":3,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":140.0,"days":2,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":153.6,"days":3,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":66.4,"days":13,"playlists":3,"churned":0,"sub":"Free"},{"minutes":74.4,"days":4,"playlists":0,"churned":0,"sub":"Premium"},{"minutes":135.4,"days":22,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":120.3,"days":8,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":154.8,"days":10,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":80.5,"days":15,"playlists":5,"churned":1,"sub":"Free"},{"minutes":113.3,"days":13,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":131.9,"days":6,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":88.4,"days":5,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":112.7,"days":14,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":79.5,"days":7,"playlists":1,"churned":0,"sub":"Free"},{"minutes":90.3,"days":1,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":53.1,"days":7,"playlists":0,"churned":1,"sub":"Free"},{"minutes":81.6,"days":2,"playlists":6,"churned":0,"sub":"Free"},{"minutes":103.5,"days":4,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":92.4,"days":11,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":40.5,"days":37,"playlists":1,"churned":1,"sub":"Free"},{"minutes":138.1,"days":8,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":122.4,"days":6,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":91.8,"days":9,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":140.6,"days":1,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":74.9,"days":0,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":33.2,"days":15,"playlists":3,"churned":1,"sub":"Free"},{"minutes":24.3,"days":22,"playlists":5,"churned":1,"sub":"Free"},{"minutes":129.3,"days":3,"playlists":8,"churned":0,"sub":"Premium"},{"minutes":6.6,"days":1,"playlists":2,"churned":0,"sub":"Free"},{"minutes":155.6,"days":9,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":126.0,"days":2,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":78.8,"days":5,"playlists":0,"churned":0,"sub":"Free"},{"minutes":72.7,"days":21,"playlists":0,"churned":0,"sub":"Free"},{"minutes":54.2,"days":10,"playlists":0,"churned":0,"sub":"Free"},{"minutes":67.2,"days":17,"playlists":2,"churned":0,"sub":"Free"},{"minutes":136.8,"days":1,"playlists":1,"churned":0,"sub":"Free"},{"minutes":89.1,"days":2,"playlists":4,"churned":0,"sub":"Free"},{"minutes":32.8,"days":7,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":123.3,"days":6,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":17.6,"days":4,"playlists":5,"churned":0,"sub":"Free"},{"minutes":77.2,"days":12,"playlists":2,"churned":0,"sub":"Free"},{"minutes":82.5,"days":34,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":125.7,"days":24,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":56.3,"days":5,"playlists":2,"churned":0,"sub":"Free"},{"minutes":129.7,"days":7,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":97.2,"days":12,"playlists":8,"churned":0,"sub":"Premium"},{"minutes":90.2,"days":2,"playlists":1,"churned":1,"sub":"Free"},{"minutes":45.2,"days":5,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":67.8,"days":1,"playlists":0,"churned":0,"sub":"Free"},{"minutes":3.9,"days":7,"playlists":1,"churned":0,"sub":"Free"},{"minutes":78.8,"days":22,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":153.7,"days":37,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":136.0,"days":6,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":61.0,"days":7,"playlists":0,"churned":0,"sub":"Free"},{"minutes":153.4,"days":37,"playlists":5,"churned":1,"sub":"Premium"},{"minutes":28.4,"days":22,"playlists":0,"churned":1,"sub":"Free"},{"minutes":95.8,"days":4,"playlists":0,"churned":0,"sub":"Free"},{"minutes":99.2,"days":0,"playlists":8,"churned":0,"sub":"Premium"},{"minutes":22.5,"days":13,"playlists":3,"churned":0,"sub":"Free"},{"minutes":97.8,"days":21,"playlists":4,"churned":1,"sub":"Free"},{"minutes":137.2,"days":2,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":138.9,"days":16,"playlists":6,"churned":1,"sub":"Premium"},{"minutes":72.1,"days":35,"playlists":0,"churned":0,"sub":"Free"},{"minutes":107.2,"days":3,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":71.0,"days":8,"playlists":0,"churned":0,"sub":"Free"},{"minutes":139.5,"days":5,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":35.0,"days":9,"playlists":5,"churned":1,"sub":"Free"},{"minutes":45.2,"days":12,"playlists":3,"churned":1,"sub":"Free"},{"minutes":115.3,"days":7,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":70.7,"days":31,"playlists":3,"churned":1,"sub":"Premium"},{"minutes":99.3,"days":5,"playlists":4,"churned":0,"sub":"Free"},{"minutes":171.3,"days":0,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":85.6,"days":1,"playlists":0,"churned":1,"sub":"Free"},{"minutes":45.9,"days":17,"playlists":3,"churned":1,"sub":"Premium"},{"minutes":148.2,"days":12,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":89.7,"days":3,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":104.1,"days":3,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":87.6,"days":4,"playlists":1,"churned":0,"sub":"Free"},{"minutes":117.7,"days":5,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":134.9,"days":6,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":118.0,"days":58,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":120.5,"days":11,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":113.7,"days":8,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":52.7,"days":16,"playlists":3,"churned":1,"sub":"Free"},{"minutes":34.3,"days":1,"playlists":2,"churned":1,"sub":"Free"},{"minutes":83.9,"days":2,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":112.5,"days":4,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":46.4,"days":2,"playlists":4,"churned":1,"sub":"Free"},{"minutes":59.2,"days":1,"playlists":3,"churned":1,"sub":"Free"},{"minutes":129.4,"days":1,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":34.0,"days":3,"playlists":1,"churned":0,"sub":"Free"},{"minutes":113.1,"days":2,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":125.4,"days":1,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":41.9,"days":4,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":134.6,"days":10,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":142.6,"days":10,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":193.9,"days":2,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":104.1,"days":2,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":149.5,"days":24,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":41.6,"days":7,"playlists":1,"churned":0,"sub":"Free"},{"minutes":92.8,"days":7,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":138.6,"days":13,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":105.0,"days":17,"playlists":6,"churned":1,"sub":"Premium"},{"minutes":79.1,"days":2,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":44.5,"days":0,"playlists":1,"churned":0,"sub":"Free"},{"minutes":181.8,"days":1,"playlists":8,"churned":0,"sub":"Premium"},{"minutes":121.0,"days":15,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":87.0,"days":3,"playlists":2,"churned":1,"sub":"Free"},{"minutes":182.8,"days":13,"playlists":7,"churned":0,"sub":"Premium"},{"minutes":62.3,"days":5,"playlists":0,"churned":0,"sub":"Free"},{"minutes":110.7,"days":29,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":50.5,"days":4,"playlists":1,"churned":0,"sub":"Free"},{"minutes":133.4,"days":1,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":116.0,"days":7,"playlists":3,"churned":1,"sub":"Premium"},{"minutes":152.1,"days":13,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":26.9,"days":9,"playlists":0,"churned":0,"sub":"Free"},{"minutes":155.7,"days":0,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":92.3,"days":2,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":45.9,"days":3,"playlists":3,"churned":0,"sub":"Free"},{"minutes":93.0,"days":26,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":136.4,"days":0,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":45.2,"days":4,"playlists":0,"churned":0,"sub":"Free"},{"minutes":117.7,"days":4,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":81.7,"days":35,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":34.5,"days":4,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":17.6,"days":7,"playlists":0,"churned":1,"sub":"Free"},{"minutes":121.7,"days":11,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":68.0,"days":10,"playlists":0,"churned":0,"sub":"Free"},{"minutes":123.8,"days":17,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":67.7,"days":2,"playlists":5,"churned":1,"sub":"Free"},{"minutes":21.2,"days":2,"playlists":3,"churned":1,"sub":"Free"},{"minutes":115.9,"days":8,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":184.6,"days":0,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":173.9,"days":1,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":74.6,"days":31,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":49.2,"days":8,"playlists":2,"churned":0,"sub":"Free"},{"minutes":81.4,"days":5,"playlists":0,"churned":0,"sub":"Free"},{"minutes":135.5,"days":3,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":117.0,"days":0,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":148.7,"days":9,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":147.6,"days":16,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":96.2,"days":4,"playlists":2,"churned":0,"sub":"Premium"},{"minutes":117.6,"days":4,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":153.5,"days":14,"playlists":5,"churned":1,"sub":"Premium"},{"minutes":110.5,"days":18,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":28.3,"days":10,"playlists":1,"churned":0,"sub":"Free"},{"minutes":79.4,"days":6,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":129.6,"days":3,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":99.2,"days":4,"playlists":2,"churned":0,"sub":"Free"},{"minutes":71.0,"days":0,"playlists":5,"churned":0,"sub":"Free"},{"minutes":58.2,"days":5,"playlists":1,"churned":1,"sub":"Free"},{"minutes":103.9,"days":0,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":67.5,"days":10,"playlists":5,"churned":0,"sub":"Free"},{"minutes":142.4,"days":9,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":66.7,"days":0,"playlists":1,"churned":0,"sub":"Free"},{"minutes":53.9,"days":0,"playlists":0,"churned":1,"sub":"Free"},{"minutes":125.1,"days":9,"playlists":1,"churned":0,"sub":"Premium"},{"minutes":130.5,"days":3,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":114.7,"days":12,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":66.9,"days":13,"playlists":3,"churned":1,"sub":"Free"},{"minutes":92.7,"days":48,"playlists":3,"churned":0,"sub":"Free"},{"minutes":38.7,"days":11,"playlists":0,"churned":0,"sub":"Free"},{"minutes":161.2,"days":20,"playlists":10,"churned":0,"sub":"Premium"},{"minutes":137.7,"days":2,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":85.6,"days":3,"playlists":3,"churned":0,"sub":"Free"},{"minutes":81.4,"days":27,"playlists":0,"churned":0,"sub":"Free"},{"minutes":59.4,"days":4,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":46.6,"days":1,"playlists":4,"churned":1,"sub":"Free"},{"minutes":131.3,"days":1,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":51.9,"days":2,"playlists":0,"churned":1,"sub":"Free"},{"minutes":122.7,"days":15,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":148.1,"days":3,"playlists":4,"churned":0,"sub":"Premium"},{"minutes":96.9,"days":3,"playlists":3,"churned":0,"sub":"Premium"},{"minutes":196.7,"days":8,"playlists":5,"churned":0,"sub":"Premium"},{"minutes":124.0,"days":0,"playlists":6,"churned":0,"sub":"Premium"},{"minutes":111.4,"days":2,"playlists":5,"churned":0,"sub":"Premium"}];

/**
 * SOURCE: df.groupby('country').agg(total, churned)
 *         .assign(rate=lambda x: (x.churned/x.total*100).round(1))
 *         .sort_values('rate', ascending=False)
 */
const COUNTRY_DATA = [
  { country: "AU", rate: 26.7, label: "Australia" },
  { country: "DE", rate: 23.0, label: "Germany" },
  { country: "US", rate: 22.3, label: "United States" },
  { country: "CA", rate: 21.8, label: "Canada" },
  { country: "IN", rate: 20.4, label: "India" },
  { country: "FR", rate: 16.0, label: "France" },
  { country: "BR", rate: 15.6, label: "Brazil" },
  { country: "RU", rate: 15.4, label: "Russia" },
  { country: "PK", rate: 15.2, label: "Pakistan" },
  { country: "UK", rate: 9.9,  label: "United Kingdom" },
];

/* ═══════════════════════════════════════════════════════════════
   SECTION COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ── Hero / Introduction ── */
function Hero() {
  return (
    <section style={{
      minHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      maxWidth: 900,
      margin: "0 auto",
      padding: "80px 24px",
    }}>
      <Reveal>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 999,
          padding: "6px 14px 6px 8px",
          marginBottom: 32,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: C.active,
            boxShadow: `0 0 8px ${C.active}`,
            display: "inline-block",
          }} />
          <span style={{ fontSize: 12, color: C.textMuted, letterSpacing: "0.04em" }}>
            Spotify Churn Analysis · 1,000 users · 10 markets
          </span>
        </div>
      </Reveal>
      <Reveal delay={1}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(40px, 8vw, 80px)",
          fontWeight: 400,
          lineHeight: 1.05,
          color: C.text,
          marginBottom: 28,
        }}>
          Why Users<br />
          <em style={{ color: C.churned }}>Stop Listening</em>
        </h1>
      </Reveal>
      <Reveal delay={2}>
        <Body style={{ fontSize: 18, maxWidth: 580 }}>
          A behavioral analysis of 1,000 Spotify users reveals that churn isn't driven
          by frustration — it's driven by{" "}
          <strong style={{ color: C.text, fontWeight: 500 }}>quiet disengagement.</strong>{" "}
          The signals are there. This is how to read them.
        </Body>
      </Reveal>
      <Reveal delay={3}>
        <div style={{ marginTop: 56, display: "flex", gap: 40, flexWrap: "wrap" }}>
          {[
            { value: "18.6%", label: "Overall churn rate", color: C.churned },
            { value: "1,000", label: "Users analyzed",     color: C.accent  },
            { value: "10",    label: "Markets studied",    color: C.active  },
          ].map(s => (
            <div key={s.label}>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 36,
                color: s.color,
                lineHeight: 1,
                marginBottom: 4,
              }}>{s.value}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal delay={3}>
        <div style={{ marginTop: 64, display: "flex", alignItems: "center", gap: 8, color: C.textDim }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>Scroll to explore</span>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Section 1: The Scale of the Problem ── */
function Section1() {
  const CustomLabel = ({ viewBox, value }) => {
    const { x, y, width } = viewBox;
    return (
      <text x={x + width / 2} y={y - 8} textAnchor="middle" fill={C.textMuted} fontSize={12}>
        {value}
      </text>
    );
  };

  return (
    <Section id="section-1">
      <Reveal>
        <Eyebrow color={C.churned}>Section 01 — Setup</Eyebrow>
        <Heading>Not all users<br />leave equally.</Heading>
        <Body>
          Of our 1,000 users, 186 have churned. That's roughly 1 in 5. But
          the headline number hides a dramatic divide: free-tier users are
          leaving at more than <strong style={{ color: C.text }}>four times the rate</strong> of Premium subscribers.
        </Body>
      </Reveal>

      {/* Big stat callout */}
      <Reveal delay={1} style={{ marginTop: 40 }}>
        <div className="stat-row" style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {[
            { tier: "Free",    rate: "35.2%", desc: "of free users churned",    color: C.churned, bg: C.churnedLight + "18" },
            { tier: "Premium", rate: "8.3%",  desc: "of premium users churned", color: C.active,  bg: C.activeLight + "18"  },
          ].map(s => (
            <div key={s.tier} style={{
              flex: 1,
              background: s.bg,
              border: `1px solid ${s.color}33`,
              borderRadius: 12,
              padding: "20px 24px",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: s.color, marginBottom: 8 }}>
                {s.tier}
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: s.color, lineHeight: 1 }}>
                {s.rate}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={2}>
        <ChartCard>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.textMuted, marginBottom: 20 }}>
            Active vs churned users by subscription tier
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={SUBSCRIPTION_DATA}
              margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
              barCategoryGap="35%"
              barGap={6}
            >
              <CartesianGrid vertical={false} stroke={C.border} strokeOpacity={0.4} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 13 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 11 }} />
              <Tooltip content={<SubTooltip />} cursor={{ fill: C.surfaceHigh + "60" }} />
              <Bar dataKey="active"  name="Active"  fill={C.active}  radius={[6,6,0,0]}>
                <LabelList dataKey="active"  position="top" style={{ fill: C.textMuted, fontSize: 11 }} />
              </Bar>
              <Bar dataKey="churned" name="Churned" fill={C.churned} radius={[6,6,0,0]}>
                <LabelList dataKey="churned" position="top" style={{ fill: C.textMuted, fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Caption>
            Free users: 383 total, 135 churned (35.2%) · Premium users: 617 total, 51 churned (8.3%)
          </Caption>
        </ChartCard>
      </Reveal>

      <Reveal delay={3} style={{ marginTop: 28 }}>
        <div style={{
          background: `${C.warning}15`,
          border: `1px solid ${C.warning}40`,
          borderRadius: 10,
          padding: "14px 20px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 18, lineHeight: 1.3 }}>⚠️</span>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            <strong style={{ color: C.text }}>Key insight:</strong> The premium moat is real —
            paying users are 4× more likely to stay. But free users represent 38% of the user base,
            making their churn a significant acquisition cost problem.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

/* ── Section 2: The Quiet Warning Signs ── */
function Section2() {
  return (
    <Section id="section-2">
      <Reveal>
        <Eyebrow color={C.accent}>Section 02 — Rising Action</Eyebrow>
        <Heading>They weren't angry.<br />They were <em style={{ color: C.textMuted }}>absent.</em></Heading>
        <Body>
          Churned users don't slam the door — they quietly drift away.
          Across every behavioral metric, churned users show measurably
          lower engagement <em>before</em> they leave: less listening, fewer playlists,
          and longer gaps between sessions.
        </Body>
      </Reveal>

      <Reveal delay={1} style={{ marginTop: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {BEHAVIORAL_DATA.map((d, i) => {
            const max = Math.max(d.active, d.churned) * 1.15;
            const activeW = (d.active / max) * 100;
            const churnedW = (d.churned / max) * 100;
            return (
              <ChartCard key={d.metric} style={{ padding: "22px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <p style={{ fontWeight: 500, fontSize: 15, color: C.text }}>{d.metric}</p>
                  <span style={{
                    fontSize: 12,
                    color: C.churned,
                    background: `${C.churned}15`,
                    border: `1px solid ${C.churned}30`,
                    borderRadius: 999,
                    padding: "2px 10px",
                  }}>
                    {d.note}
                  </span>
                </div>
                {/* Active bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.active }}>Active users</span>
                    <span style={{ fontSize: 12, color: C.active, fontWeight: 600 }}>
                      {d.active}{d.unit}
                    </span>
                  </div>
                  <div style={{ height: 10, background: C.surfaceHigh, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${activeW}%`,
                      background: `linear-gradient(90deg, ${C.active}, ${C.activeDark})`,
                      borderRadius: 999,
                      transition: "width 1s ease",
                    }} />
                  </div>
                </div>
                {/* Churned bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.churned }}>Churned users</span>
                    <span style={{ fontSize: 12, color: C.churned, fontWeight: 600 }}>
                      {d.churned}{d.unit}
                    </span>
                  </div>
                  <div style={{ height: 10, background: C.surfaceHigh, borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${churnedW}%`,
                      background: `linear-gradient(90deg, ${C.churned}, ${C.churnedDark})`,
                      borderRadius: 999,
                      transition: "width 1s ease",
                    }} />
                  </div>
                </div>
              </ChartCard>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={2} style={{ marginTop: 32 }}>
        <Body>
          Notably, skips per day are nearly identical between groups (4.7 active vs 4.4 churned).
          Users who churn aren't skipping more — they're showing up less. Disengagement is
          the signal, not dissatisfaction with content.
        </Body>
      </Reveal>
    </Section>
  );
}

/* ── Section 3: The Danger Zone ── */
function Section3() {
  const [filter, setFilter] = useState("all"); // "all" | "Free" | "Premium"

  const displayData = SCATTER_DATA.filter(d =>
    filter === "all" ? true : d.sub === filter
  );

  const activePoints  = displayData.filter(d => !d.churned);
  const churnedPoints = displayData.filter(d =>  d.churned);

  return (
    <Section id="section-3">
      <Reveal>
        <Eyebrow color={C.warning}>Section 03 — Climax</Eyebrow>
        <Heading>Mapping the<br /><em style={{ color: C.warning }}>danger zone.</em></Heading>
        <Body>
          Plotting every user by their daily listening time and days since last login
          reveals a cluster of high-risk users — and some active users dangerously
          close to the same territory.
        </Body>
      </Reveal>

      <Reveal delay={1} style={{ marginTop: 32 }}>
        {/* Filter controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["all", "Free", "Premium"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? C.accent : C.surface,
                color: filter === f ? "#fff" : C.textMuted,
                border: `1px solid ${filter === f ? C.accent : C.border}`,
                borderRadius: 999,
                padding: "6px 16px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >
              {f === "all" ? "All users" : f}
            </button>
          ))}
        </div>

        <ChartCard>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.textMuted, marginBottom: 4 }}>
            Daily listening minutes vs days since last login
          </p>
          <p style={{ fontSize: 12, color: C.textDim, marginBottom: 20 }}>
            Dot size = number of playlists · Color = churn status
          </p>

          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 24, left: 0, bottom: 20 }}>
              <CartesianGrid stroke={C.border} strokeOpacity={0.3} />
              <XAxis
                type="number" dataKey="minutes" name="Daily minutes"
                domain={[0, 240]}
                label={{ value: "Avg daily listening (min)", position: "insideBottom", offset: -12, fill: C.textMuted, fontSize: 12 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="number" dataKey="days" name="Days since login"
                domain={[0, 65]}
                label={{ value: "Days since last login", angle: -90, position: "insideLeft", offset: 14, fill: C.textMuted, fontSize: 12 }}
                axisLine={false} tickLine={false}
              />
              <ZAxis type="number" dataKey="playlists" range={[20, 140]} />
              <Tooltip content={<ScatterTooltip />} cursor={{ stroke: C.border }} />

              {/* Danger zone shading */}
              <ReferenceArea
                x1={0} x2={80} y1={15} y2={65}
                fill={C.churned} fillOpacity={0.07}
                stroke={C.churned} strokeOpacity={0.25}
                strokeDasharray="4 3"
                label={{ value: "⚠ Danger zone", position: "insideTopRight", fill: C.churned, fontSize: 12, fontWeight: 500 }}
              />

              <Scatter name="Active"  data={activePoints}  fill={C.active}  fillOpacity={0.7} />
              <Scatter name="Churned" data={churnedPoints} fill={C.churned} fillOpacity={0.8} />
              <Legend
                wrapperStyle={{ paddingTop: 12, fontSize: 13, color: C.textMuted }}
                formatter={(value) => <span style={{ color: value === "Active" ? C.active : C.churned }}>{value}</span>}
              />
            </ScatterChart>
          </ResponsiveContainer>

          <Caption>
            300 randomly sampled users · Danger zone: &lt;80 min/day AND &gt;15 days since login
          </Caption>
        </ChartCard>
      </Reveal>

      <Reveal delay={2} style={{ marginTop: 28 }}>
        <div style={{
          background: `${C.warning}15`,
          border: `1px solid ${C.warning}40`,
          borderRadius: 10,
          padding: "14px 20px",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
            <strong style={{ color: C.text }}>Actionable finding:</strong> Users in the danger zone
            (low listening + high inactivity) are your most immediate churn risk.
            Use this scatter as a live monitoring dashboard — any active user drifting into
            this quadrant should trigger a re-engagement campaign.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}

/* ── Section 4: Where to Focus ── */
function Section4() {
  const THRESHOLD = 20; // highlight countries above this churn rate

  const recommendations = [
    {
      icon: "💳",
      title: "Convert free users",
      body: "Free users churn at 4× the rate of Premium. A targeted free-trial-to-premium pipeline in AU, DE, and US — your highest-churn markets — could have the highest ROI of any retention initiative.",
      color: C.churned,
    },
    {
      icon: "🔔",
      title: "Re-engage dormant users",
      body: "Users with 10+ days since last login are statistically over-represented in the churned group. Personalized push notifications or email featuring new releases in their top genre can close the gap.",
      color: C.accent,
    },
    {
      icon: "🎵",
      title: "Deepen playlist investment",
      body: "Active users hold 38% more playlists than churned users. In-app prompts to create playlists — especially for new free users — correlate with stronger retention and higher session frequency.",
      color: C.active,
    },
  ];

  return (
    <Section id="section-4">
      <Reveal>
        <Eyebrow color={C.active}>Section 04 — Resolution</Eyebrow>
        <Heading>Where to focus.<br />What to do.</Heading>
        <Body>
          Churn isn't distributed evenly across markets. Australia, Germany,
          and the US show the highest rates — and the UK's unusually low churn
          offers a model worth studying.
        </Body>
      </Reveal>

      <Reveal delay={1} style={{ marginTop: 40 }}>
        <ChartCard>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.textMuted, marginBottom: 20 }}>
            Churn rate by country — ranked highest to lowest
          </p>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={COUNTRY_DATA}
              layout="vertical"
              margin={{ top: 0, right: 48, left: 8, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid horizontal={false} stroke={C.border} strokeOpacity={0.4} />
              <XAxis
                type="number" domain={[0, 32]}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${v}%`}
              />
              <YAxis
                type="category" dataKey="label"
                axisLine={false} tickLine={false}
                tick={{ fill: C.textMuted, fontSize: 12 }}
                width={120}
              />
              <Tooltip content={<CountryTooltip />} cursor={{ fill: C.surfaceHigh + "40" }} />
              <ReferenceLine x={THRESHOLD} stroke={C.warning} strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: "Alert threshold (20%)", position: "right", fill: C.warning, fontSize: 11 }} />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                {COUNTRY_DATA.map((d) => (
                  <Cell
                    key={d.country}
                    fill={d.rate >= THRESHOLD ? C.churned : C.active}
                    fillOpacity={d.rate >= THRESHOLD ? 0.9 : 0.65}
                  />
                ))}
                <LabelList dataKey="rate" position="right" formatter={v => `${v}%`}
                  style={{ fill: C.textMuted, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Caption>
            Coral bars exceed the 20% alert threshold · UK at 9.9% is the benchmark market
          </Caption>
        </ChartCard>
      </Reveal>

      {/* Recommendation cards */}
      <Reveal delay={2} style={{ marginTop: 48 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textDim, marginBottom: 20 }}>
          Recommended actions
        </p>
        <div className="two-col" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {recommendations.map((r, i) => (
            <div key={i} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${r.color}`,
              borderRadius: "0 12px 12px 0",
              padding: "20px 24px",
              display: "flex",
              gap: 16,
            }}>
              <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{r.icon}</span>
              <div>
                <p style={{ fontWeight: 500, fontSize: 15, color: C.text, marginBottom: 6 }}>{r.title}</p>
                <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}>{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

/* ── Conclusion ── */
function Conclusion() {
  return (
    <section style={{
      maxWidth: 900,
      margin: "0 auto",
      padding: "80px 24px 120px",
      textAlign: "center",
    }}>
      <Divider />
      <Reveal style={{ paddingTop: 80 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textDim, marginBottom: 24 }}>
          Core takeaway
        </p>
        <blockquote style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(20px, 3.5vw, 28px)",
          fontWeight: 400,
          color: C.text,
          lineHeight: 1.45,
          maxWidth: 660,
          margin: "0 auto 32px",
          fontStyle: "italic",
        }}>
          "Free users churn at much higher rates than Premium users, and the earliest warning signs
          are disengagement — fewer minutes, fewer playlists, and longer gaps between logins."
        </blockquote>
        <p style={{ fontSize: 14, color: C.textDim }}>
          Dataset: 1,000 users · 10 countries · Columns: user_id, subscription_type, country,
          avg_daily_minutes, number_of_playlists, top_genre, skips_per_day, support_tickets,
          days_since_last_login, churned
        </p>
      </Reveal>
    </section>
  );
}

/* ── Navigation dots (fixed right side) ── */
function NavDots() {
  const sections = [
    { id: "hero",      label: "Intro"          },
    { id: "section-1", label: "The Problem"    },
    { id: "section-2", label: "Warning Signs"  },
    { id: "section-3", label: "Danger Zone"    },
    { id: "section-4", label: "Resolution"     },
  ];
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const targets = sections.map(s => document.getElementById(s.id)).filter(Boolean);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { threshold: 0.4 }
    );
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{
      position: "fixed",
      right: 20,
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      zIndex: 100,
    }}>
      {sections.map(s => (
        <button
          key={s.id}
          title={s.label}
          onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" })}
          style={{
            width: active === s.id ? 10 : 7,
            height: active === s.id ? 10 : 7,
            borderRadius: "50%",
            background: active === s.id ? C.accent : C.surfaceHigh,
            border: "none",
            cursor: "pointer",
            transition: "all 0.25s",
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function SpotifyChurnStory() {
  // Inject global CSS once
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <NavDots />

      {/* Thin progress line at top */}
      <ScrollProgress />

      <div id="hero"><Hero /></div>
      <Divider />
      <Section1 />
      <Divider />
      <Section2 />
      <Divider />
      <Section3 />
      <Divider />
      <Section4 />
      <Conclusion />
    </div>
  );
}

/** Thin scroll-progress bar at the top of the viewport */
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      setPct((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 200, background: C.surface }}>
      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.active}, ${C.accent})`, transition: "width 0.1s linear" }} />
    </div>
  );
}
