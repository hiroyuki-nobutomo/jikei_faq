import { STEPS } from "../data/constants";

export default function StepIndicator({ current }) {
  return (
    <div style={{ display: "flex", gap: 0, margin: "0 0 32px", position: "relative" }}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: done ? "#1a6b4a" : active ? "#2563eb" : "#d1d5db",
              color: done || active ? "#fff" : "#6b7280",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700,
              transition: "all .3s",
              boxShadow: active ? "0 0 0 4px rgba(37,99,235,.2)" : "none"
            }}>
              {done ? "✓" : i + 1}
            </div>
            <span style={{
              marginTop: 6, fontSize: 11, fontWeight: active ? 700 : 400,
              color: active ? "#2563eb" : done ? "#1a6b4a" : "#9ca3af",
              letterSpacing: ".02em"
            }}>{s}</span>
            {i < STEPS.length - 1 && (
              <div style={{
                position: "absolute", top: 15, left: "calc(50% + 20px)", right: "calc(-50% + 20px)",
                height: 2, background: done ? "#1a6b4a" : "#e5e7eb", zIndex: 0
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
