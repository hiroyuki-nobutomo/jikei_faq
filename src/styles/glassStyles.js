const glassBase = {
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  borderRadius: 14,
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  transition: "all .25s cubic-bezier(.4,0,.2,1)",
  letterSpacing: ".01em",
};

export const glassPrimary = {
  ...glassBase,
  padding: "11px 28px",
  background: "linear-gradient(135deg, rgba(37,99,235,.72) 0%, rgba(59,130,246,.58) 100%)",
  border: "1px solid rgba(255,255,255,.35)",
  color: "#fff",
  boxShadow: "0 4px 24px rgba(37,99,235,.25), inset 0 1px 0 rgba(255,255,255,.3)",
};

export const glassPrimaryDisabled = {
  ...glassBase,
  padding: "11px 28px",
  background: "rgba(203,213,225,.45)",
  border: "1px solid rgba(203,213,225,.3)",
  color: "rgba(100,116,139,.6)",
  boxShadow: "none",
  cursor: "default",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

export const glassSuccess = {
  ...glassBase,
  padding: "11px 28px",
  background: "linear-gradient(135deg, rgba(26,107,74,.72) 0%, rgba(22,163,74,.55) 100%)",
  border: "1px solid rgba(255,255,255,.3)",
  color: "#fff",
  boxShadow: "0 4px 24px rgba(26,107,74,.22), inset 0 1px 0 rgba(255,255,255,.25)",
};

export const glassSuccessDisabled = {
  ...glassBase,
  padding: "11px 28px",
  background: "rgba(203,213,225,.45)",
  border: "1px solid rgba(203,213,225,.3)",
  color: "rgba(100,116,139,.6)",
  boxShadow: "none",
  cursor: "default",
};

export const backBtnStyle = {
  ...glassBase,
  padding: "11px 20px",
  background: "rgba(255,255,255,.55)",
  border: "1px solid rgba(226,232,240,.7)",
  color: "#475569",
  boxShadow: "0 2px 12px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.6)",
};

export const glassHeader = (active) => ({
  ...glassBase,
  padding: "7px 16px", borderRadius: 12, fontSize: 11,
  background: active ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.08)",
  border: active ? "1px solid rgba(255,255,255,.4)" : "1px solid rgba(255,255,255,.18)",
  color: "#fff",
  boxShadow: active ? "0 2px 16px rgba(255,255,255,.1), inset 0 1px 0 rgba(255,255,255,.2)" : "none",
});

export const glassTab = (active) => ({
  ...glassBase,
  padding: "9px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
  background: active
    ? "linear-gradient(135deg, rgba(37,99,235,.68) 0%, rgba(59,130,246,.52) 100%)"
    : "rgba(255,255,255,.6)",
  border: active ? "1px solid rgba(255,255,255,.35)" : "1px solid rgba(226,232,240,.6)",
  color: active ? "#fff" : "#334155",
  boxShadow: active
    ? "0 4px 20px rgba(37,99,235,.18), inset 0 1px 0 rgba(255,255,255,.25)"
    : "0 1px 8px rgba(0,0,0,.03), inset 0 1px 0 rgba(255,255,255,.7)",
});

export const glassSmall = (active) => ({
  ...glassBase,
  padding: "3px 10px", borderRadius: 8, fontSize: 11,
  background: active ? "rgba(37,99,235,.08)" : "rgba(239,68,68,.08)",
  border: active ? "1px solid rgba(37,99,235,.2)" : "1px solid rgba(239,68,68,.2)",
  color: active ? "#2563eb" : "#dc2626",
});

export const selectStyle = {
  display: "block", width: "100%", marginTop: 6, padding: "10px 12px",
  borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13,
  background: "#fff", color: "#1e293b", fontFamily: "inherit"
};

export const inputStyle = {
  display: "block", width: "100%", marginTop: 6, padding: "10px 12px",
  borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13,
  background: "#fff", color: "#1e293b", fontFamily: "inherit",
  boxSizing: "border-box"
};

export { glassBase };
