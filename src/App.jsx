import { useState, useRef, useEffect } from "react";
import { INQUIRER_TYPES, ORG_TYPES, DISABILITY_TYPES, SKILL_LEVELS } from "./data/constants";
import { INITIAL_KNOWLEDGE_BASE } from "./data/knowledgeBase";
import { generateAIDraft } from "./services/aiService";
import { generateCaseId, generateReplyUrl, createCaseRecord } from "./services/threadService";
import { setupSheets, fetchKnowledge, addKnowledgeToSheet, updateKnowledgeOnSheet, deleteKnowledgeFromSheet, fetchCasesAndThreads, addCaseToSheet } from "./services/sheetService";
import { useHashRouting } from "./hooks/useHashRouting";
import { glassPrimary, glassPrimaryDisabled, glassSuccess, glassBase, backBtnStyle, glassTab, selectStyle, inputStyle } from "./styles/glassStyles";
import Header from "./components/Header";
import StepIndicator from "./components/StepIndicator";
import Badge from "./components/Badge";
import PublicReplyPage from "./components/PublicReplyPage";
import KnowledgePanel from "./components/KnowledgePanel";
import HistoryPanel from "./components/HistoryPanel";

export default function App() {
  // ── Workflow state ──
  const [step, setStep] = useState(0);
  const [inquiry, setInquiry] = useState("");
  const [meta, setMeta] = useState({ requesterName: "", inquirer: "", org: "", disabilities: [], skill: 3 });
  const [aiDraft, setAiDraft] = useState("");
  const [finalResponse, setFinalResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [editHistory, setEditHistory] = useState([]);
  const textRef = useRef(null);

  // ── Data state ──
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [lastPublishedCase, setLastPublishedCase] = useState(null);
  const [inquiryThreads, setInquiryThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  // ── UI state ──
  const [adminMode, setAdminMode] = useState("workflow");
  const [kbForm, setKbForm] = useState({ disability: "", topic: "", content: "" });
  const { viewMode, viewCaseId, switchToPublic, switchToAdmin } = useHashRouting();

  const viewingCase = viewCaseId
    ? allCases.find(c => c.id === viewCaseId) || lastPublishedCase
    : lastPublishedCase;

  // ── 起動時にシートからデータ読み込み ──
  useEffect(() => {
    async function loadData() {
      try {
        await setupSheets();
        const [kbData, casesData] = await Promise.all([
          fetchKnowledge(),
          fetchCasesAndThreads(),
        ]);
        if (kbData.length > 0) {
          setKnowledgeBase(kbData);
        } else {
          setKnowledgeBase(INITIAL_KNOWLEDGE_BASE);
        }
        if (casesData.cases.length > 0) {
          setAllCases(casesData.cases);
          setLastPublishedCase(casesData.cases[casesData.cases.length - 1]);
          setInquiryThreads(casesData.threads);
          if (casesData.threads.length > 0) {
            setSelectedThreadId(casesData.threads[0].id);
          }
        }
      } catch (err) {
        console.error("データ読み込みエラー:", err);
        setKnowledgeBase(INITIAL_KNOWLEDGE_BASE);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  // ── AI回答生成 ──
  async function handleGenerateDraft() {
    setLoading(true);
    try {
      const text = await generateAIDraft({ inquiry, meta, knowledgeBase });
      setAiDraft(text);
      setFinalResponse(text);
      setEditHistory([{ version: 1, text, editor: "AI", timestamp: new Date().toISOString() }]);
    } catch (err) {
      setAiDraft(`回答の生成中にエラーが発生しました。\n\n詳細: ${err.message}\n\nもう一度お試しください。`);
      setFinalResponse("");
    } finally {
      setLoading(false);
    }
  }

  // ── 回答確定 ──
  async function handleConfirm() {
    const caseId = generateCaseId();
    const caseRecord = createCaseRecord({ caseId, inquiry, meta, finalResponse });

    if (finalResponse !== aiDraft) {
      setEditHistory(h => [...h, { version: h.length + 1, text: finalResponse, editor: "担当者", timestamp: new Date().toISOString() }]);
    }

    // シートに保存
    try {
      await addCaseToSheet(caseRecord);
    } catch (err) {
      console.error("案件保存エラー:", err);
    }

    // UIを更新（シートから再読み込みする代わりにローカル更新）
    setLastPublishedCase(caseRecord);
    setAllCases(c => [...c, caseRecord]);

    // スレッド再構築
    try {
      const casesData = await fetchCasesAndThreads();
      setAllCases(casesData.cases);
      setInquiryThreads(casesData.threads);
      if (casesData.threads.length > 0) {
        const latestThread = casesData.threads.find(t =>
          t.inquiries.some(i => i.id === caseId)
        );
        setSelectedThreadId(latestThread?.id || casesData.threads[0].id);
      }
    } catch {
      // フォールバック: ローカルのまま
    }

    setStep(4);
  }

  // ── ワークフローリセット ──
  function handleNewInquiry() {
    setStep(0);
    setInquiry("");
    setAiDraft("");
    setFinalResponse("");
    setEditHistory([]);
    setMeta({ requesterName: "", inquirer: "", org: "", disabilities: [], skill: 3 });
  }

  // ── ナレッジ操作 ──
  async function handleAddOrUpdateKnowledge() {
    if (!kbForm.disability || !kbForm.topic.trim() || !kbForm.content.trim()) return;
    try {
      if (kbForm.editId) {
        await updateKnowledgeOnSheet({ id: kbForm.editId, disability: kbForm.disability, topic: kbForm.topic.trim(), content: kbForm.content.trim() });
        setKnowledgeBase(prev => prev.map(item =>
          item.id === kbForm.editId
            ? { ...item, disability: kbForm.disability, topic: kbForm.topic.trim(), content: kbForm.content.trim() }
            : item
        ));
      } else {
        const newId = "KB-" + Date.now().toString(36).toUpperCase();
        await addKnowledgeToSheet({ id: newId, disability: kbForm.disability, topic: kbForm.topic.trim(), content: kbForm.content.trim() });
        setKnowledgeBase(prev => [{ id: newId, disability: kbForm.disability, topic: kbForm.topic.trim(), content: kbForm.content.trim() }, ...prev]);
      }
    } catch (err) {
      console.error("ナレッジ保存エラー:", err);
    }
    setKbForm({ disability: "", topic: "", content: "" });
  }

  function handleEditKnowledge(item) {
    setKbForm({ editId: item.id, disability: item.disability, topic: item.topic, content: item.content });
  }

  async function handleDeleteKnowledge(id) {
    try {
      await deleteKnowledgeFromSheet(id);
    } catch (err) {
      console.error("ナレッジ削除エラー:", err);
    }
    setKnowledgeBase(prev => prev.filter(item => item.id !== id));
    if (kbForm.editId === id) setKbForm({ disability: "", topic: "", content: "" });
  }

  // ── Escalation ──
  const needsEscalation = aiDraft.includes("担当者による確認");

  // ── Render ──
  return (
    <div style={{
      fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      minHeight: "100vh", background: "#f8f9fb", color: "#1e293b"
    }}>
      <Header
        viewMode={viewMode}
        onSwitchToAdmin={switchToAdmin}
        onSwitchToPublic={() => lastPublishedCase ? switchToPublic(lastPublishedCase.id) : null}
      />

      {dataLoading ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e2e8f0",
            borderTopColor: "#2563eb", borderRadius: "50%",
            animation: "spin 1s linear infinite", margin: "0 auto 16px"
          }} />
          <div style={{ fontSize: 13, color: "#6b7280" }}>データを読み込み中…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : viewMode === "public" ? (
        <PublicReplyPage
          viewingCase={viewingCase}
          allCases={allCases}
          viewCaseId={viewCaseId}
          lastPublishedCaseId={lastPublishedCase?.id}
          onSelectCase={switchToPublic}
        />
      ) : (
        <div style={{ maxWidth: 780, margin: "24px auto", padding: "0 16px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => setAdminMode("workflow")} style={glassTab(adminMode === "workflow")}>相談ワークフロー</button>
            <button onClick={() => setAdminMode("knowledge")} style={glassTab(adminMode === "knowledge")}>ナレッジ登録</button>
            <button onClick={() => setAdminMode("history")} style={glassTab(adminMode === "history")}>履歴管理</button>
          </div>

          {adminMode === "workflow" && <StepIndicator current={step} />}

          <div style={{
            background: "#fff", borderRadius: 14, padding: "28px 32px",
            boxShadow: "0 1px 8px rgba(0,0,0,.05)", minHeight: 320
          }}>
            {/* ── ナレッジ登録 ── */}
            {adminMode === "knowledge" && (
              <KnowledgePanel
                knowledgeBase={knowledgeBase}
                kbForm={kbForm}
                onFormChange={setKbForm}
                onAdd={handleAddOrUpdateKnowledge}
                onEdit={handleEditKnowledge}
                onDelete={handleDeleteKnowledge}
                onCancel={() => setKbForm({ disability: "", topic: "", content: "" })}
              />
            )}

            {/* ── 履歴管理 ── */}
            {adminMode === "history" && (
              <HistoryPanel
                threads={inquiryThreads}
                selectedThreadId={selectedThreadId}
                onSelectThread={setSelectedThreadId}
                onViewReply={switchToPublic}
              />
            )}

            {/* ── Step 0: 受付・投入 ── */}
            {adminMode === "workflow" && step === 0 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0f3460" }}>
                  &#x2460; 相談内容の投入
                </h3>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                  メール・メッセンジャー等から受け取った相談文をペーストしてください。
                </p>
                <textarea
                  ref={textRef}
                  value={inquiry}
                  onChange={e => setInquiry(e.target.value)}
                  placeholder="例：母が脳卒中で右半身麻痺になりました。タブレットを使いたいのですが、片手で操作する方法はありますか？"
                  style={{
                    width: "100%", minHeight: 140, padding: 14, borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 14, lineHeight: 1.8,
                    resize: "vertical", boxSizing: "border-box", fontFamily: "inherit"
                  }}
                />
                <div style={{ marginTop: 20, textAlign: "right" }}>
                  <button disabled={!inquiry.trim()} onClick={() => setStep(1)} style={inquiry.trim() ? glassPrimary : glassPrimaryDisabled}>次へ：属性設定 →</button>
                </div>
              </div>
            )}

            {/* ── Step 1: 属性設定 ── */}
            {adminMode === "workflow" && step === 1 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0f3460" }}>
                  &#x2461; 相談者の属性設定
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, gridColumn: "1 / -1" }}>
                    問い合わせ者名（任意）
                    <input value={meta.requesterName} onChange={e => setMeta({ ...meta, requesterName: e.target.value })} placeholder="例：山田 花子" style={inputStyle} />
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>
                    相談者タイプ
                    <select value={meta.inquirer} onChange={e => setMeta({ ...meta, inquirer: e.target.value })} style={selectStyle}>
                      <option value="">選択してください</option>
                      {INQUIRER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>
                    所属
                    <select value={meta.org} onChange={e => setMeta({ ...meta, org: e.target.value })} style={selectStyle}>
                      <option value="">選択してください</option>
                      {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>障害種別（複数選択可）</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {DISABILITY_TYPES.map(d => {
                      const sel = meta.disabilities.includes(d);
                      return (
                        <button key={d} onClick={() => {
                          setMeta({ ...meta, disabilities: sel ? meta.disabilities.filter(x => x !== d) : [...meta.disabilities, d] });
                        }} style={{
                          ...glassBase, padding: "8px 18px", borderRadius: 22,
                          border: sel ? "1.5px solid rgba(37,99,235,.5)" : "1px solid rgba(226,232,240,.6)",
                          background: sel ? "linear-gradient(135deg, rgba(37,99,235,.18), rgba(59,130,246,.12))" : "rgba(255,255,255,.55)",
                          color: sel ? "#2563eb" : "#475569", fontSize: 12, fontWeight: sel ? 700 : 500,
                          boxShadow: sel ? "0 2px 12px rgba(37,99,235,.12), inset 0 1px 0 rgba(255,255,255,.4)" : "0 1px 6px rgba(0,0,0,.03), inset 0 1px 0 rgba(255,255,255,.7)",
                        }}>{d}</button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    ICT習熟度: <span style={{ color: "#2563eb" }}>{SKILL_LEVELS[meta.skill - 1].label}</span>
                  </div>
                  <input type="range" min={1} max={5} value={meta.skill} onChange={e => setMeta({ ...meta, skill: +e.target.value })} style={{ width: "100%", accentColor: "#2563eb" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
                    <span>未経験</span><span>応用可能</span>
                  </div>
                </div>
                <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setStep(0)} style={backBtnStyle}>← 戻る</button>
                  <button disabled={!meta.inquirer || !meta.org || meta.disabilities.length === 0}
                    onClick={() => { setStep(2); handleGenerateDraft(); }}
                    style={(meta.inquirer && meta.org && meta.disabilities.length > 0) ? glassPrimary : glassPrimaryDisabled}>次へ：AI回答生成 →</button>
                </div>
              </div>
            )}

            {/* ── Step 2: AI回答案 ── */}
            {adminMode === "workflow" && step === 2 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "#0f3460" }}>
                  &#x2462; AI回答案の生成
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
                  <Badge color="#2563eb">{meta.inquirer}</Badge>
                  <Badge color="#7c3aed">{meta.org}</Badge>
                  {meta.disabilities.map(d => <Badge key={d} color="#059669">{d}</Badge>)}
                  <Badge color="#d97706">習熟度 {meta.skill}</Badge>
                </div>
                {loading ? (
                  <div style={{ textAlign: "center", padding: 60 }}>
                    <div style={{
                      width: 40, height: 40, border: "3px solid #e2e8f0",
                      borderTopColor: "#2563eb", borderRadius: "50%",
                      animation: "spin 1s linear infinite", margin: "0 auto 16px"
                    }} />
                    <div style={{ fontSize: 13, color: "#6b7280" }}>ナレッジベースを参照して回答を生成中…</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <>
                    {needsEscalation && (
                      <div style={{
                        background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8,
                        padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#92400e",
                        display: "flex", alignItems: "center", gap: 8
                      }}>
                        &#x26A0;&#xFE0F; <strong>エスカレーション通知:</strong> この相談にはナレッジベース外の知識が必要です。新規ナレッジの作成を検討してください。
                      </div>
                    )}
                    <div style={{
                      background: "#f8fafc", borderRadius: 10, padding: 20,
                      border: "1px solid #e2e8f0", fontSize: 13, lineHeight: 1.9,
                      whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto"
                    }}>{aiDraft}</div>
                    <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                      <button onClick={() => setStep(1)} style={backBtnStyle}>← 属性を修正</button>
                      <button onClick={() => setStep(3)} style={glassPrimary}>次へ：修正・確定 →</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 3: 修正・確定 ── */}
            {adminMode === "workflow" && step === 3 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "#0f3460" }}>
                  &#x2463; 回答の修正・確定
                </h3>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                  AI生成案を確認し、必要に応じて修正してください。修正された内容は次回以降のナレッジとして蓄積されます。
                </p>
                <textarea
                  value={finalResponse}
                  onChange={e => setFinalResponse(e.target.value)}
                  style={{
                    width: "100%", minHeight: 220, padding: 14, borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 14, lineHeight: 1.9,
                    resize: "vertical", boxSizing: "border-box", fontFamily: "inherit"
                  }}
                />
                {finalResponse !== aiDraft && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#2563eb", display: "flex", alignItems: "center", gap: 4 }}>
                    &#x270F;&#xFE0F; AI原案から修正されています（修正履歴に記録されます）
                  </div>
                )}
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setStep(2)} style={backBtnStyle}>← AI案を再確認</button>
                  <button onClick={handleConfirm} style={glassSuccess}>✓ 確定して公開</button>
                </div>
              </div>
            )}

            {/* ── Step 4: 回答URL ── */}
            {adminMode === "workflow" && step === 4 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#1a6b4a" }}>
                  ✓ 回答URLが生成されました
                </h3>
                <div style={{
                  background: "#f0fdf4", borderRadius: 10, padding: 20,
                  border: "1px solid #bbf7d0", marginBottom: 20
                }}>
                  <div style={{ fontSize: 12, color: "#166534", fontWeight: 600, marginBottom: 8 }}>
                    以下のURLから回答を確認できます
                  </div>
                  <a
                    href={lastPublishedCase ? `#/reply/${lastPublishedCase.id}` : "#"}
                    onClick={(e) => { e.preventDefault(); if (lastPublishedCase) switchToPublic(lastPublishedCase.id); }}
                    style={{
                      display: "block", background: "#fff", borderRadius: 6, padding: "10px 14px",
                      fontSize: 13, color: "#2563eb", wordBreak: "break-all",
                      border: "1px solid #e2e8f0", textDecoration: "none", cursor: "pointer",
                    }}
                  >
                    &#x1F517; {lastPublishedCase ? generateReplyUrl(lastPublishedCase.id) : ""}
                  </a>
                  <div style={{ marginTop: 10, fontSize: 11, color: "#6b7280" }}>
                    このURLを相談者に共有してください。クリックすると回答ページを表示します。
                  </div>
                </div>
                <div style={{
                  background: "#eff6ff", borderRadius: 10, padding: 20,
                  border: "1px solid #bfdbfe", marginBottom: 20
                }}>
                  <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 600, marginBottom: 6 }}>
                    &#x1F9E0; ナレッジ自動蓄積
                  </div>
                  <div style={{ fontSize: 12, color: "#3b82f6" }}>
                    確定回答がベクトルDBへ追加（Upsert）されました。<br />
                    次回の類似相談でこの回答が優先的にヒットします。
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>修正履歴</div>
                  {editHistory.map((h, i) => (
                    <div key={i} style={{
                      padding: "10px 14px", borderLeft: `3px solid ${h.editor === "AI" ? "#2563eb" : "#1a6b4a"}`,
                      marginBottom: 8, background: "#f8fafc", borderRadius: "0 6px 6px 0", fontSize: 12
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        v{h.version} — {h.editor}
                        <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 10 }}>
                          {new Date(h.timestamp).toLocaleString("ja-JP")}
                        </span>
                      </div>
                      <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                        {h.text.slice(0, 120)}…
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleNewInquiry} style={glassPrimary}>+ 新しい相談を受付</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
