import { glassBase } from "../styles/glassStyles";

export default function PublicReplyPage({ viewingCase, allCases, viewCaseId, lastPublishedCaseId, onSelectCase }) {
  if (!viewingCase) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontSize: 14 }}>
        まだ公開された回答がありません。管理画面でワークフローを完了してください。
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "32px auto", padding: "0 16px" }}>
      {allCases.length > 1 && (
        <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {allCases.map(c => {
            const isActive = viewCaseId === c.id || (!viewCaseId && c.id === lastPublishedCaseId);
            return (
              <button key={c.id} onClick={() => onSelectCase(c.id)} style={{
                ...glassBase, padding: "6px 14px", borderRadius: 10, fontSize: 11,
                background: isActive
                  ? "linear-gradient(135deg, rgba(37,99,235,.65), rgba(59,130,246,.48))"
                  : "rgba(255,255,255,.55)",
                border: isActive ? "1px solid rgba(255,255,255,.35)" : "1px solid rgba(226,232,240,.6)",
                color: isActive ? "#fff" : "#475569",
                boxShadow: "0 1px 6px rgba(0,0,0,.04)",
              }}>{c.id}</button>
            );
          })}
        </div>
      )}
      <div style={{
        background: "#fff", borderRadius: 16, padding: 32,
        boxShadow: "0 2px 12px rgba(0,0,0,.06)"
      }}>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
          案件番号: {viewingCase.id}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px", lineHeight: 1.6 }}>
          ご相談への回答
        </h2>
        <div style={{
          background: "#f0fdf4", borderLeft: "4px solid #1a6b4a",
          padding: "16px 20px", borderRadius: "0 8px 8px 0",
          fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap"
        }} role="main" aria-label="回答内容">
          {viewingCase.finalResponse}
        </div>
        <div style={{ marginTop: 24, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
          <strong>慈恵医科大学 アクセシビリティ支援チーム</strong><br />
          この回答は専門スタッフが確認・編集した内容です。<br />
          ご不明な点がございましたら、担当窓口までお問い合わせください。
        </div>
      </div>
    </div>
  );
}
