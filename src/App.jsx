import { useState, useEffect, useRef } from "react";

// ── Sample knowledge base (simulates RAG) ──
const KNOWLEDGE_BASE = [
  {
    id: "KB001",
    disability: "運動機能重度障害",
    topic: "視線入力",
    content: "視線入力装置（Tobii等）は、重度運動機能障害の方のPC操作に有効です。Windows標準の視線制御機能と組み合わせることで、文字入力・ウェブブラウジング・メール送受信が可能になります。導入には①視線入力装置の選定 ②PCへの取り付け ③キャリブレーション（視線調整）④操作練習の4ステップが必要です。習熟には個人差がありますが、概ね2〜4週間の練習期間を想定してください。"
  },
  {
    id: "KB002",
    disability: "発話困難",
    topic: "意思伝達装置",
    content: "発話が困難な方には、意思伝達装置（VOCA: Voice Output Communication Aid）の活用をお勧めします。iPad用アプリ「DropTalk」や「トーキングエイド」は、シンボルや文字盤をタッチすることで音声出力が可能です。身体機能に応じて、タッチ操作が難しい場合はスイッチ入力への切り替えも可能です。補装具費支給制度により、自己負担を軽減できる場合があります。"
  },
  {
    id: "KB003",
    disability: "視覚障害",
    topic: "スクリーンリーダー",
    content: "視覚障害のある方のスマートフォン利用には、iOS の VoiceOver または Android の TalkBack が標準搭載されています。初期設定では、ホームボタンのトリプルクリック（またはサイドボタン）で起動できます。操作方法は通常と異なり、1回タップで読み上げ・ダブルタップで決定となります。最初は身近な方と一緒に練習されることをお勧めします。"
  },
  {
    id: "KB004",
    disability: "聴覚障害",
    topic: "字幕・文字変換",
    content: "聴覚障害のある方のコミュニケーション支援として、音声文字変換アプリが有効です。Google「音声文字変換」アプリ（Android）やAppleの「ライブキャプション」機能により、対面会話や電話をリアルタイムでテキスト化できます。医療場面では、UDトーク等の専用アプリが多く利用されています。"
  },
  {
    id: "KB005",
    disability: "重複障害",
    topic: "環境制御装置",
    content: "重複障害のある方の生活環境改善には、環境制御装置（ECS）の導入が効果的です。わずかな身体動作（まばたき、呼気等）で照明・エアコン・テレビ等の家電操作が可能になります。スマートスピーカーとスマートリモコンの組み合わせにより、比較的安価に環境制御を実現できるケースも増えています。"
  }
];

const INQUIRER_TYPES = ["患者本人", "家族", "介護者", "PT（理学療法士）", "OT（作業療法士）", "ST（言語聴覚士）", "看護師", "医師", "その他"];
const ORG_TYPES = ["病院（急性期）", "病院（回復期）", "病院（療養期）", "老健施設", "特別養護老人ホーム", "訪問リハビリ", "訪問看護", "行政機関", "教育機関", "その他"];
const DISABILITY_TYPES = ["運動機能重度障害", "発話困難", "意思伝達困難", "視覚障害", "聴覚障害", "重複障害"];
const SKILL_LEVELS = [
  { value: 1, label: "1 — ほぼ未経験" },
  { value: 2, label: "2 — 基本操作に支援が必要" },
  { value: 3, label: "3 — 基本操作は可能" },
  { value: 4, label: "4 — 日常的に利用" },
  { value: 5, label: "5 — 応用操作も可能" }
];

const STEPS = ["受付・投入", "属性設定", "AI生成", "修正・確定", "公開・蓄積"];

// ── Utility ──
function generateId() {
  return "CASE-" + Date.now().toString(36).toUpperCase();
}
function generateUrl(id) {
  return `https://accessibility.jikei.ac.jp/reply/${id}`;
}

// ── Components ──
function StepIndicator({ current }) {
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

function Badge({ children, color = "#6366f1" }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      background: color + "18", color, fontSize: 11, fontWeight: 600, marginRight: 6, marginBottom: 4
    }}>{children}</span>
  );
}

// ── Main App ──
export default function App() {
  const [step, setStep] = useState(0);
  const [caseId] = useState(generateId);
  const [inquiry, setInquiry] = useState("");
  const [meta, setMeta] = useState({ inquirer: "", org: "", disabilities: [], skill: 3 });
  const [aiDraft, setAiDraft] = useState("");
  const [finalResponse, setFinalResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState("admin"); // admin | public
  const [allCases, setAllCases] = useState([]);
  const textRef = useRef(null);

  // ── AI generation (Mock Simulation) ──
  // 注意: ブラウザから直接Anthropic APIを叩くことはCORS制限で弾かれるため、
  // プロトタイプ用に内容を自動生成（モック）する仕組みに置き換えています。
  async function generateDraft() {
    setLoading(true);
    
    // 重い処理を模倣（2秒待機）
    await new Promise(resolve => setTimeout(resolve, 2000));

    const relevantKB = KNOWLEDGE_BASE.filter(
      kb => meta.disabilities.some(d => kb.disability === d) || meta.disabilities.length === 0
    );

    let text = `【AIによる回答原案（デモ用シミュレーション）】\n\n本日はご相談ありがとうございます。${meta.inquirer}様のお問い合わせ内容につきまして、以下の通りご案内いたします。\n\n`;

    if (relevantKB.length > 0) {
      text += `ご指定の障害（${meta.disabilities.join("・")}）に対して、当チームのナレッジから以下の解決策を提案します。\n\n`;
      relevantKB.forEach(kb => {
        text += `■ ${kb.topic}\n${kb.content}\n\n`;
      });
      text += `相談者様のICT習熟度（レベル${meta.skill}）に基づき、${meta.skill <= 2 ? "専門用語を避けた丁寧な操作説明" : "効率的な応用テクニック"}も併せて提供可能です。実際の操作にあたってご不明点があればいつでもお問い合わせください。`;
    } else {
      text += `申し訳ありません。現在のデータベースには、ご指定の条件に直接該当する有効な情報が登録されていません。\n\n※この領域は担当者による確認をお勧めします。`;
    }

    setAiDraft(text);
    setFinalResponse(text);
    setHistory([{ version: 1, text, editor: "AI", timestamp: new Date().toISOString() }]);
    setLoading(false);
  }

  function confirmResponse() {
    if (finalResponse !== aiDraft) {
      setHistory(h => [...h, { version: h.length + 1, text: finalResponse, editor: "担当者", timestamp: new Date().toISOString() }]);
    }
    setPublished(true);
    setAllCases(c => [...c, {
      id: caseId,
      inquiry: inquiry.slice(0, 60) + (inquiry.length > 60 ? "…" : ""),
      meta,
      finalResponse,
      url: generateUrl(caseId),
      timestamp: new Date().toISOString()
    }]);
    setStep(4);
  }

  // ── Escalation detection ──
  const needsEscalation = aiDraft.includes("担当者による確認");

  // ── Render ──
  return (
    <div style={{
      fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
      minHeight: "100vh",
      background: "#f8f9fb",
      color: "#1e293b"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f3460 0%, #1a5276 50%, #1a6b4a 100%)",
        padding: "18px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(255,255,255,.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20
          }}>♿</div>
          <div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: ".03em" }}>
              アクセシビリティAI相談支援
            </div>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 10, marginTop: 1 }}>
              慈恵医科大学 — 管理コンソール
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setViewMode("admin")} style={{
            padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,.3)",
            background: viewMode === "admin" ? "rgba(255,255,255,.2)" : "transparent",
            color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600
          }}>管理画面</button>
          <button onClick={() => setViewMode("public")} style={{
            padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,.3)",
            background: viewMode === "public" ? "rgba(255,255,255,.2)" : "transparent",
            color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600
          }}>公開ページ プレビュー</button>
        </div>
      </div>

      {viewMode === "public" && published ? (
        /* ── Public page preview ── */
        <div style={{ maxWidth: 680, margin: "32px auto", padding: "0 16px" }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 32,
            boxShadow: "0 2px 12px rgba(0,0,0,.06)"
          }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
              案件番号: {caseId}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px", lineHeight: 1.6 }}>
              ご相談への回答
            </h2>
            <div style={{
              background: "#f0fdf4", borderLeft: "4px solid #1a6b4a",
              padding: "16px 20px", borderRadius: "0 8px 8px 0",
              fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap"
            }} role="main" aria-label="回答内容">
              {finalResponse}
            </div>
            <div style={{ marginTop: 24, padding: "12px 16px", background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
              <strong>慈恵医科大学 アクセシビリティ支援チーム</strong><br />
              この回答は専門スタッフが確認・編集した内容です。<br />
              ご不明な点がございましたら、担当窓口までお問い合わせください。
            </div>
          </div>
        </div>
      ) : viewMode === "public" && !published ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontSize: 14 }}>
          まだ公開された回答がありません。管理画面でワークフローを完了してください。
        </div>
      ) : (
        /* ── Admin panel ── */
        <div style={{ maxWidth: 780, margin: "24px auto", padding: "0 16px" }}>
          <StepIndicator current={step} />

          <div style={{
            background: "#fff", borderRadius: 14, padding: "28px 32px",
            boxShadow: "0 1px 8px rgba(0,0,0,.05)", minHeight: 320
          }}>
            {/* Step 0: Intake */}
            {step === 0 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0f3460" }}>
                  ① 相談内容の投入
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
                    resize: "vertical", boxSizing: "border-box",
                    fontFamily: "inherit"
                  }}
                />
                <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                  📎 画像添付（将来拡張予定）
                </div>
                <div style={{ marginTop: 20, textAlign: "right" }}>
                  <button disabled={!inquiry.trim()} onClick={() => setStep(1)} style={{
                    padding: "10px 28px", borderRadius: 8, border: "none",
                    background: inquiry.trim() ? "#2563eb" : "#cbd5e1",
                    color: "#fff", fontWeight: 700, fontSize: 13, cursor: inquiry.trim() ? "pointer" : "default"
                  }}>次へ：属性設定 →</button>
                </div>
              </div>
            )}

            {/* Step 1: Metadata */}
            {step === 1 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0f3460" }}>
                  ② 相談者の属性設定
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>
                    相談者タイプ
                    <select value={meta.inquirer} onChange={e => setMeta({ ...meta, inquirer: e.target.value })}
                      style={selectStyle}>
                      <option value="">選択してください</option>
                      {INQUIRER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>
                    所属
                    <select value={meta.org} onChange={e => setMeta({ ...meta, org: e.target.value })}
                      style={selectStyle}>
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
                          setMeta({
                            ...meta,
                            disabilities: sel
                              ? meta.disabilities.filter(x => x !== d)
                              : [...meta.disabilities, d]
                          });
                        }} style={{
                          padding: "7px 16px", borderRadius: 20,
                          border: sel ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                          background: sel ? "#eff6ff" : "#fff",
                          color: sel ? "#2563eb" : "#475569",
                          fontSize: 12, fontWeight: sel ? 700 : 400, cursor: "pointer"
                        }}>{d}</button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    ICT習熟度: <span style={{ color: "#2563eb" }}>{SKILL_LEVELS[meta.skill - 1].label}</span>
                  </div>
                  <input type="range" min={1} max={5} value={meta.skill}
                    onChange={e => setMeta({ ...meta, skill: +e.target.value })}
                    style={{ width: "100%", accentColor: "#2563eb" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
                    <span>未経験</span><span>応用可能</span>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setStep(0)} style={backBtnStyle}>← 戻る</button>
                  <button disabled={!meta.inquirer || !meta.org || meta.disabilities.length === 0}
                    onClick={() => { setStep(2); generateDraft(); }}
                    style={{
                      padding: "10px 28px", borderRadius: 8, border: "none",
                      background: (meta.inquirer && meta.org && meta.disabilities.length > 0) ? "#2563eb" : "#cbd5e1",
                      color: "#fff", fontWeight: 700, fontSize: 13,
                      cursor: (meta.inquirer && meta.org && meta.disabilities.length > 0) ? "pointer" : "default"
                    }}>次へ：AI回答生成 →</button>
                </div>
              </div>
            )}

            {/* Step 2: AI Draft */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "#0f3460" }}>
                  ③ AI回答案の生成
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
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      ナレッジベースを参照して回答を生成中…
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <>
                    {needsEscalation && (
                      <div style={{
                        background: "#fef3c7", border: "1px solid #f59e0b",
                        borderRadius: 8, padding: "10px 16px", marginBottom: 16,
                        fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8
                      }}>
                        ⚠️ <strong>エスカレーション通知:</strong> この相談にはナレッジベース外の知識が必要です。新規ナレッジの作成を検討してください。
                      </div>
                    )}
                    <div style={{
                      background: "#f8fafc", borderRadius: 10, padding: 20,
                      border: "1px solid #e2e8f0", fontSize: 13, lineHeight: 1.9,
                      whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto"
                    }}>
                      {aiDraft}
                    </div>
                    <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                      <button onClick={() => setStep(1)} style={backBtnStyle}>← 属性を修正</button>
                      <button onClick={() => setStep(3)} style={{
                        padding: "10px 28px", borderRadius: 8, border: "none",
                        background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
                      }}>次へ：修正・確定 →</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Edit & Confirm */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "#0f3460" }}>
                  ④ 回答の修正・確定
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
                  <div style={{
                    marginTop: 8, fontSize: 11, color: "#2563eb",
                    display: "flex", alignItems: "center", gap: 4
                  }}>
                    ✏️ AI原案から修正されています（修正履歴に記録されます）
                  </div>
                )}
                <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
                  <button onClick={() => setStep(2)} style={backBtnStyle}>← AI案を再確認</button>
                  <button onClick={confirmResponse} style={{
                    padding: "10px 28px", borderRadius: 8, border: "none",
                    background: "#1a6b4a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
                  }}>✓ 確定して公開</button>
                </div>
              </div>
            )}

            {/* Step 4: Published */}
            {step === 4 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#1a6b4a" }}>
                  ✓ 公開・蓄積完了
                </h3>
                <div style={{
                  background: "#f0fdf4", borderRadius: 10, padding: 20,
                  border: "1px solid #bbf7d0", marginBottom: 20
                }}>
                  <div style={{ fontSize: 12, color: "#166534", fontWeight: 600, marginBottom: 8 }}>
                    回答が公開されました
                  </div>
                  <div style={{
                    background: "#fff", borderRadius: 6, padding: "10px 14px",
                    fontSize: 13, color: "#2563eb", wordBreak: "break-all",
                    border: "1px solid #e2e8f0"
                  }}>
                    🔗 {generateUrl(caseId)}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: "#6b7280" }}>
                    このURLを相談者に共有してください。認証なしで閲覧可能です。
                  </div>
                </div>

                <div style={{
                  background: "#eff6ff", borderRadius: 10, padding: 20,
                  border: "1px solid #bfdbfe", marginBottom: 20
                }}>
                  <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 600, marginBottom: 6 }}>
                    🧠 ナレッジ自動蓄積
                  </div>
                  <div style={{ fontSize: 12, color: "#3b82f6" }}>
                    確定回答がベクトルDBへ追加（Upsert）されました。<br />
                    次回の類似相談でこの回答が優先的にヒットします。
                  </div>
                </div>

                {/* Version history */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>修正履歴</div>
                  {history.map((h, i) => (
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

                <button onClick={() => {
                  setStep(0); setInquiry(""); setAiDraft(""); setFinalResponse("");
                  setPublished(false); setHistory([]);
                  setMeta({ inquirer: "", org: "", disabilities: [], skill: 3 });
                }} style={{
                  padding: "10px 28px", borderRadius: 8, border: "none",
                  background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>+ 新しい相談を受付</button>
              </div>
            )}
          </div>

          {/* Case list sidebar */}
          {allCases.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: "#475569" }}>
                処理済み案件
              </div>
              {allCases.map(c => (
                <div key={c.id} style={{
                  background: "#fff", borderRadius: 8, padding: "12px 16px",
                  marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,.04)",
                  fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#0f3460", marginRight: 10 }}>{c.id}</span>
                    {c.inquiry}
                  </div>
                  <span style={{ color: "#1a6b4a", fontSize: 11, whiteSpace: "nowrap" }}>✓ 公開済</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  display: "block", width: "100%", marginTop: 6, padding: "10px 12px",
  borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13,
  background: "#fff", color: "#1e293b", fontFamily: "inherit"
};

const backBtnStyle = {
  padding: "10px 20px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", background: "#fff",
  color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer"
};
