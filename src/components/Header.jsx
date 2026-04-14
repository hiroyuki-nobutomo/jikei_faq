import { glassHeader } from "../styles/glassStyles";

export default function Header({ viewMode, onSwitchToAdmin, onSwitchToPublic }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0f3460 0%, #312e81 50%, #6b21a8 100%)",
      padding: "18px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "rgba(255,255,255,.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20
        }}>&#x267F;</div>
        <div>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: ".03em" }}>
            アクセシビリティAI相談支援 <span style={{ color: "#d8b4fe", fontSize: 13, marginLeft: 8 }}>Gemini版</span>
          </div>
          <div style={{ color: "rgba(255,255,255,.6)", fontSize: 10, marginTop: 1 }}>
            慈恵医科大学 — 管理コンソール
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSwitchToAdmin} style={glassHeader(viewMode === "admin")}>管理画面</button>
        <button onClick={onSwitchToPublic} style={glassHeader(viewMode === "public")}>回答ページプレビュー</button>
      </div>
    </div>
  );
}
