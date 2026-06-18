import { STEPS } from "../data/constants";

export default function StepIndicator({ current, onStepClick }) {
  return (
    <div style={{ display: "flex", gap: 0, margin: "0 0 32px", position: "relative" }}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        // 過去のステップ（done）のみクリックで戻れる。公開後（step===4）は移動不可。
        const clickable = !!onStepClick && done && current !== 4;

        return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(i) : undefined}
              aria-label={clickable ? `${s} に戻る` : s}
              title={clickable ? `${s} に戻る` : undefined}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: clickable ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                outline: "none",
              }}
              onMouseEnter={e => {
                if (clickable) {
                  const dot = e.currentTarget.querySelector("[data-dot]");
                  if (dot) dot.style.boxShadow = "0 0 0 4px rgba(26,107,74,.18)";
                }
              }}
              onMouseLeave={e => {
                if (clickable) {
                  const dot = e.currentTarget.querySelector("[data-dot]");
                  if (dot) dot.style.boxShadow = "none";
                }
              }}
            >
              <div data-dot style={{
                width: 32, height: 32, borderRadius: "50%",
                background: done ? "#1a6b4a" : active ? "#2563eb" : "#d1d5db",
                color: done || active ? "#fff" : "#6b7280",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                transition: "box-shadow .2s",
                boxShadow: active ? "0 0 0 4px rgba(37,99,235,.2)" : "none"
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 400,
                color: active ? "#2563eb" : done ? "#1a6b4a" : "#9ca3af",
                letterSpacing: ".02em",
                textDecoration: clickable ? "underline dotted" : "none",
                textUnderlineOffset: 3,
              }}>{s}</span>
            </button>
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
