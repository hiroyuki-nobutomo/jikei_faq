import { generateReplyUrl } from "../services/threadService";

export default function HistoryPanel({ threads, selectedThreadId, onSelectThread, onViewReply }) {
  const selectedThread = threads.find(t => t.id === selectedThreadId) || threads[0];

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "#0f3460" }}>
        問い合わせ履歴管理
      </h3>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        同一問い合わせ者の案件を1つのスレッドに集約して表示します。
      </p>
      {threads.length === 0 ? (
        <div style={{ padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
          まだ履歴はありません。相談を公開するとここに追加されます。
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 14 }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, maxHeight: 420, overflowY: "auto" }}>
            {threads.map(thread => (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                style={{
                  width: "100%", textAlign: "left", border: "none",
                  background: selectedThreadId === thread.id ? "#eff6ff" : "#fff",
                  borderBottom: "1px solid #f1f5f9", padding: "12px 12px", cursor: "pointer"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{thread.requesterName}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  {thread.inquiries.length}件 / 最終: {new Date(thread.updatedAt).toLocaleString("ja-JP")}
                </div>
              </button>
            ))}
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, maxHeight: 420, overflowY: "auto", background: "#f8fafc" }}>
            {selectedThread && selectedThread.inquiries.map((item, idx) => (
              <div key={item.id} style={{ background: "#fff", borderRadius: 8, padding: 12, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 22, height: 22, borderRadius: "50%", fontSize: 10, fontWeight: 700,
                      background: "#2563eb", color: "#fff"
                    }}>{idx + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>{item.id}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(item.timestamp).toLocaleString("ja-JP")}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                  <strong>相談:</strong> {item.fullInquiry}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  <strong>回答:</strong> {item.finalResponse.slice(0, 200)}{item.finalResponse.length > 200 ? "…" : ""}
                </div>
                <div style={{ marginTop: 6 }}>
                  <button
                    onClick={() => onViewReply(item.id)}
                    style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 10,
                      background: "rgba(37,99,235,.06)", border: "1px solid rgba(37,99,235,.15)",
                      color: "#2563eb", cursor: "pointer", fontWeight: 600
                    }}
                  >回答ページを表示</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
