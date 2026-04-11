export default function Badge({ children, color = "#6366f1" }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      background: color + "18", color, fontSize: 11, fontWeight: 600, marginRight: 6, marginBottom: 4
    }}>{children}</span>
  );
}
