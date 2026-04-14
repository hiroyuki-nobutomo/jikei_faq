import Badge from "./Badge";
import { DISABILITY_TYPES } from "../data/constants";
import { glassBase, glassSuccess, glassSuccessDisabled, backBtnStyle, selectStyle, inputStyle } from "../styles/glassStyles";

export default function KnowledgePanel({ knowledgeBase, kbForm, onFormChange, onAdd, onEdit, onDelete, onCancel }) {
  const canSubmit = kbForm.disability && kbForm.topic.trim() && kbForm.content.trim();

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "#0f3460" }}>
        ナレッジベース入力
      </h3>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        相談対応で得られた知見を登録します。登録後はAI回答生成時の参照対象に含まれます。
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          障害種別
          <select value={kbForm.disability} onChange={e => onFormChange({ ...kbForm, disability: e.target.value })} style={selectStyle}>
            <option value="">選択してください</option>
            {DISABILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12, fontWeight: 600 }}>
          トピック
          <input value={kbForm.topic} onChange={e => onFormChange({ ...kbForm, topic: e.target.value })} placeholder="例：片手操作ジェスチャー" style={inputStyle} />
        </label>
      </div>
      <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 600 }}>
        内容
        <textarea
          value={kbForm.content}
          onChange={e => onFormChange({ ...kbForm, content: e.target.value })}
          placeholder="活用方法、導入手順、注意点などを記載"
          style={{
            width: "100%", minHeight: 120, padding: 12, borderRadius: 8, boxSizing: "border-box",
            border: "1.5px solid #e2e8f0", marginTop: 6, fontSize: 13, lineHeight: 1.7, fontFamily: "inherit"
          }}
        />
      </label>
      {kbForm.editId && (
        <div style={{
          marginTop: 12, padding: "8px 12px", background: "#eff6ff",
          borderRadius: 8, fontSize: 11, color: "#2563eb", display: "flex", alignItems: "center", gap: 6
        }}>
          &#x270F;&#xFE0F; 編集中: {kbForm.editId}
        </div>
      )}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {kbForm.editId && (
          <button onClick={onCancel} style={backBtnStyle}>キャンセル</button>
        )}
        <button onClick={onAdd} disabled={!canSubmit} style={canSubmit ? glassSuccess : glassSuccessDisabled}>
          {kbForm.editId ? "✓ 更新" : "+ ナレッジを追加"}
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
          登録済みナレッジ（{knowledgeBase.length}件）
        </div>
        <div style={{ display: "grid", gap: 8, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
          {knowledgeBase.map(item => (
            <div key={item.id} style={{
              border: kbForm.editId === item.id ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
              borderRadius: 8, padding: "10px 12px",
              background: kbForm.editId === item.id ? "#eff6ff" : "#f8fafc",
              transition: "all .2s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#64748b" }}>{item.id}</span>
                <Badge color="#059669">{item.disability}</Badge>
                <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{item.topic}</span>
                <button onClick={() => onEdit(item)} style={{
                  ...glassBase, padding: "3px 10px", borderRadius: 8, fontSize: 11,
                  background: "rgba(37,99,235,.08)", border: "1px solid rgba(37,99,235,.2)", color: "#2563eb",
                }}>編集</button>
                <button onClick={() => onDelete(item.id)} style={{
                  ...glassBase, padding: "3px 10px", borderRadius: 8, fontSize: 11,
                  background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#dc2626",
                }}>削除</button>
              </div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
                {item.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
