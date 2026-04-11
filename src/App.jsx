import { useState, useRef, useEffect, useCallback } from "react";

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

const STEPS = ["受付・投入", "属性設定", "AI生成", "修正・確定", "回答URL"];

// ── Utility ──
function generateId() {
  return "CASE-" + Date.now().toString(36).toUpperCase();
}
function generateUrl(id) {
  return `${window.location.origin}${window.location.pathname}#/reply/${id}`;
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

// ── Demo completed cases ──
const DEMO_CASES = [
  {
    id: "CASE-DEMO001",
    requesterName: "田中 美咲",
    inquiry: "母が脳卒中で右半身麻痺になり、タブレットを片手で操作する方法を教えてほしい",
    fullInquiry: "母が脳卒中で右半身麻痺になりました。以前はiPadで家族とLINEをしていたのですが、右手が使えなくなり操作が難しくなっています。片手でタブレットを操作する方法はありますか？特にLINEでのメッセージ入力と写真の送受信ができるようになりたいです。",
    meta: { requesterName: "田中 美咲", inquirer: "家族", org: "病院（回復期）", disabilities: ["運動機能重度障害"], skill: 3 },
    finalResponse: "ご相談ありがとうございます。右半身麻痺の方のiPad操作について、以下の方法をご案内いたします。\n\n■ 片手操作のための設定\niPadの「設定」→「アクセシビリティ」→「タッチ」から、以下を有効にしてください。\n・AssistiveTouch: 画面上に仮想ホームボタンを表示し、複雑なジェスチャーを簡単な操作に置き換えられます\n・片手キーボード: キーボードを左寄せに配置し、左手だけでの入力を楽にします\n\n■ タブレットスタンドの活用\n片手操作には、角度調整可能なタブレットスタンドの使用を強くお勧めします。端末を固定することで、片手での安定した操作が可能になります。\n\n■ 音声入力の活用\nLINEのメッセージ入力には、キーボード上のマイクボタンから音声入力が利用できます。「Hey Siri、○○にLINEを送って」でも送信可能です。\n\n■ 写真の送受信\nLINEのカメラボタン→写真選択は片手でも操作しやすい設計です。撮影にはSiriを活用（「Hey Siri、写真を撮って」）する方法もあります。\n\nICT習熟度がレベル3とのことですので、基本操作は問題なく対応いただけると思います。スタンドの選定や具体的な設定手順でお困りの際は、お気軽にご相談ください。",
    timestamp: "2025-04-08T10:30:00.000Z"
  },
  {
    id: "CASE-DEMO002",
    requesterName: "鈴木 健一",
    inquiry: "ALS患者の意思伝達手段について、視線入力装置の導入を検討したい",
    fullInquiry: "担当しているALS患者様（60代男性）の意思伝達手段について相談です。現在、わずかに眼球運動と瞬きが可能な状態です。視線入力装置の導入を検討していますが、具体的にどの製品が適しているか、また導入までの流れを教えていただけますか。補装具費支給制度の利用も考えています。",
    meta: { requesterName: "鈴木 健一", inquirer: "OT（作業療法士）", org: "病院（療養期）", disabilities: ["運動機能重度障害", "発話困難"], skill: 4 },
    finalResponse: "ご相談ありがとうございます。ALS患者様への視線入力装置導入について、以下の通りご案内いたします。\n\n■ 推奨される視線入力装置\n現在の身体機能（眼球運動・瞬き可能）から、以下の製品が候補となります。\n\n1. Tobii Dynavox PCEye 5\n  - Windows PCに接続して使用\n  - 高精度な視線追跡、頭部の微動にも対応\n  - 意思伝達ソフト「miyasuku」「OriHime eye」等と組み合わせ可能\n\n2. Tobii Dynavox I-Series\n  - 視線入力装置一体型のコミュニケーションデバイス\n  - 持ち運び可能で病室・自宅どちらでも利用可\n\n■ 導入の流れ\n①評価：眼球運動の安定性、最適な設置距離の確認（OT様にて実施）\n②デモ機の試用：販売代理店から2週間程度の貸出が可能です\n③キャリブレーション（視線調整）：10分程度、5〜9点の注視で完了\n④操作練習：習熟まで概ね2〜4週間を想定\n\n■ 補装具費支給制度について\n「重度障害者用意思伝達装置」として補装具費支給制度の対象となります。\n・自己負担：原則1割（所得に応じた上限あり）\n・申請先：お住まいの市区町村の障害福祉課\n・必要書類：医師の意見書、身体障害者手帳\n\nOT様のICT習熟度がレベル4とのことですので、導入後の設定・調整もスムーズに進められるかと思います。デモ機手配のご連絡先等、詳細が必要でしたらお知らせください。",
    timestamp: "2025-04-09T14:15:00.000Z"
  },
  {
    id: "CASE-DEMO003",
    requesterName: "山本 裕子",
    inquiry: "聴覚障害のある患者への診察時コミュニケーション支援ツールを知りたい",
    fullInquiry: "外来診察で聴覚障害のある患者さんが増えています。筆談では時間がかかり、細かいニュアンスが伝わりにくいことがあります。診察場面で使える音声文字変換ツールやコミュニケーション支援アプリを教えてください。できれば医療用語にも対応しているものが望ましいです。",
    meta: { requesterName: "山本 裕子", inquirer: "医師", org: "病院（急性期）", disabilities: ["聴覚障害"], skill: 2 },
    finalResponse: "ご相談ありがとうございます。聴覚障害のある患者様との診察時コミュニケーション支援について、以下をご案内いたします。\n\n■ 推奨ツール\n\n1. UDトーク（最も推奨）\n  - 医療現場での導入実績が最も豊富な音声文字変換アプリ\n  - 医療用語辞書を搭載しており、専門用語の認識精度が高い\n  - iOS/Android対応、月額利用料なし（施設向けライセンスあり）\n  - 話した内容がリアルタイムで患者様のスマートフォンに表示されます\n\n2. Googleの「音声文字変換」アプリ（Android）\n  - 無料で利用可能、インストールするだけで即使用開始\n  - 一般的な会話には十分な精度ですが、医療専門用語はやや弱い\n\n3. Appleの「ライブキャプション」機能（iOS 16以降）\n  - iPhone/iPadの標準機能として利用可能\n  - 設定→アクセシビリティ→ライブキャプション で有効化\n\n■ 診察室での運用のコツ\n・静かな環境であるほど認識精度が向上します\n・医師はゆっくり明瞭に話すことを意識してください\n・認識ミスがないか、患者様に随時確認を取りながら進めてください\n・重要な説明（病名告知、手術説明等）は従来通り書面での補足を推奨します\n\nICT習熟度がレベル2とのことですので、まずはUDトークの基本操作（アプリ起動→話すだけ）から始められることをお勧めします。操作方法のレクチャーが必要でしたら、お気軽にお申し付けください。",
    timestamp: "2025-04-10T09:45:00.000Z"
  }
];

const DEMO_THREADS = [
  {
    id: "THREAD-DEMO001",
    requesterName: "田中 美咲",
    inquiries: [DEMO_CASES[0]],
    updatedAt: DEMO_CASES[0].timestamp
  },
  {
    id: "THREAD-DEMO002",
    requesterName: "鈴木 健一",
    inquiries: [DEMO_CASES[1]],
    updatedAt: DEMO_CASES[1].timestamp
  },
  {
    id: "THREAD-DEMO003",
    requesterName: "山本 裕子",
    inquiries: [DEMO_CASES[2]],
    updatedAt: DEMO_CASES[2].timestamp
  }
];

// ── Main App ──
export default function App() {
  const [step, setStep] = useState(0);
  const [knowledgeBase, setKnowledgeBase] = useState(KNOWLEDGE_BASE);
  const [inquiry, setInquiry] = useState("");
  const [meta, setMeta] = useState({ requesterName: "", inquirer: "", org: "", disabilities: [], skill: 3 });
  const [aiDraft, setAiDraft] = useState("");
  const [finalResponse, setFinalResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [published, setPublished] = useState(true);
  const [lastPublishedCase, setLastPublishedCase] = useState(DEMO_CASES[DEMO_CASES.length - 1]);
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState("admin"); // admin | public
  const [viewCaseId, setViewCaseId] = useState(null);
  const [adminMode, setAdminMode] = useState("workflow"); // workflow | knowledge | history
  const [kbForm, setKbForm] = useState({ disability: "", topic: "", content: "" });
  const [allCases, setAllCases] = useState(DEMO_CASES);
  const [inquiryThreads, setInquiryThreads] = useState(DEMO_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState(DEMO_THREADS[0].id);
  const textRef = useRef(null);

  // ── Hash routing for reply pages ──
  const handleHashChange = useCallback(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/reply\/(.+)$/);
    if (match) {
      setViewCaseId(match[1]);
      setViewMode("public");
    }
  }, []);

  useEffect(() => {
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [handleHashChange]);

  const switchToPublic = (caseId) => {
    if (caseId) {
      window.location.hash = `/reply/${caseId}`;
    } else if (lastPublishedCase) {
      window.location.hash = `/reply/${lastPublishedCase.id}`;
    }
    setViewMode("public");
  };

  const switchToAdmin = () => {
    window.location.hash = "";
    setViewCaseId(null);
    setViewMode("admin");
  };

  const viewingCase = viewCaseId
    ? allCases.find(c => c.id === viewCaseId) || lastPublishedCase
    : lastPublishedCase;

  // ── AI generation (Mock Simulation) ──
  // 注意: ブラウザから直接Anthropic APIを叩くことはCORS制限で弾かれるため、
  // プロトタイプ用に内容を自動生成（モック）する仕組みに置き換えています。
  async function generateDraft() {
    setLoading(true);
    
    // 重い処理を模倣（2秒待機）
    await new Promise(resolve => setTimeout(resolve, 2000));

    const relevantKB = knowledgeBase.filter(
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
    const currentCaseId = generateId();
    const normalizedRequesterName = meta.requesterName.trim();
    const threadKey = normalizedRequesterName || `未入力-${currentCaseId}`;
    const caseRecord = {
      id: currentCaseId,
      requesterName: normalizedRequesterName || "未入力",
      inquiry: inquiry.slice(0, 60) + (inquiry.length > 60 ? "…" : ""),
      fullInquiry: inquiry,
      meta,
      finalResponse,
      url: generateUrl(currentCaseId),
      timestamp: new Date().toISOString()
    };

    if (finalResponse !== aiDraft) {
      setHistory(h => [...h, { version: h.length + 1, text: finalResponse, editor: "担当者", timestamp: new Date().toISOString() }]);
    }
    setPublished(true);
    setLastPublishedCase(caseRecord);
    setAllCases(c => [...c, caseRecord]);
    setInquiryThreads(prev => {
      const index = prev.findIndex(t => t.requesterName === threadKey);
      if (index === -1) {
        const newThread = {
          id: "THREAD-" + Date.now().toString(36).toUpperCase(),
          requesterName: threadKey,
          inquiries: [caseRecord],
          updatedAt: caseRecord.timestamp
        };
        setSelectedThreadId(newThread.id);
        return [newThread, ...prev];
      }
      const updated = [...prev];
      const target = updated[index];
      const updatedThread = {
        ...target,
        inquiries: [...target.inquiries, caseRecord],
        updatedAt: caseRecord.timestamp
      };
      updated[index] = updatedThread;
      setSelectedThreadId(updatedThread.id);
      updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return updated;
    });
    setStep(4);
  }

  function addKnowledge() {
    if (!kbForm.disability || !kbForm.topic.trim() || !kbForm.content.trim()) return;
    const newEntry = {
      id: "KB-" + Date.now().toString(36).toUpperCase(),
      disability: kbForm.disability,
      topic: kbForm.topic.trim(),
      content: kbForm.content.trim()
    };
    setKnowledgeBase(prev => [newEntry, ...prev]);
    setKbForm({ disability: "", topic: "", content: "" });
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
          <button onClick={switchToAdmin} style={glassHeader(viewMode === "admin")}>管理画面</button>
          <button onClick={() => switchToPublic(null)} style={glassHeader(viewMode === "public")}>回答ページプレビュー</button>
        </div>
      </div>

      {viewMode === "public" && viewingCase ? (
        /* ── Public reply page ── */
        <div style={{ maxWidth: 680, margin: "32px auto", padding: "0 16px" }}>
          {allCases.length > 1 && (
            <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {allCases.map(c => (
                <button key={c.id} onClick={() => switchToPublic(c.id)} style={{
                  ...glassBase, padding: "6px 14px", borderRadius: 10, fontSize: 11,
                  background: (viewCaseId === c.id || (!viewCaseId && c.id === lastPublishedCase?.id))
                    ? "linear-gradient(135deg, rgba(37,99,235,.65), rgba(59,130,246,.48))"
                    : "rgba(255,255,255,.55)",
                  border: (viewCaseId === c.id || (!viewCaseId && c.id === lastPublishedCase?.id))
                    ? "1px solid rgba(255,255,255,.35)" : "1px solid rgba(226,232,240,.6)",
                  color: (viewCaseId === c.id || (!viewCaseId && c.id === lastPublishedCase?.id)) ? "#fff" : "#475569",
                  boxShadow: "0 1px 6px rgba(0,0,0,.04)",
                }}>{c.id}</button>
              ))}
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
      ) : viewMode === "public" && !viewingCase ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", fontSize: 14 }}>
          まだ公開された回答がありません。管理画面でワークフローを完了してください。
        </div>
      ) : (
        /* ── Admin panel ── */
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
            {adminMode === "knowledge" && (
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
                    <select
                      value={kbForm.disability}
                      onChange={e => setKbForm({ ...kbForm, disability: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="">選択してください</option>
                      {DISABILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>
                    トピック
                    <input
                      value={kbForm.topic}
                      onChange={e => setKbForm({ ...kbForm, topic: e.target.value })}
                      placeholder="例：片手操作ジェスチャー"
                      style={inputStyle}
                    />
                  </label>
                </div>
                <label style={{ display: "block", marginTop: 14, fontSize: 12, fontWeight: 600 }}>
                  内容
                  <textarea
                    value={kbForm.content}
                    onChange={e => setKbForm({ ...kbForm, content: e.target.value })}
                    placeholder="活用方法、導入手順、注意点などを記載"
                    style={{
                      width: "100%", minHeight: 120, padding: 12, borderRadius: 8, boxSizing: "border-box",
                      border: "1.5px solid #e2e8f0", marginTop: 6, fontSize: 13, lineHeight: 1.7, fontFamily: "inherit"
                    }}
                  />
                </label>
                <div style={{ marginTop: 14, textAlign: "right" }}>
                  <button
                    onClick={addKnowledge}
                    disabled={!kbForm.disability || !kbForm.topic.trim() || !kbForm.content.trim()}
                    style={(kbForm.disability && kbForm.topic.trim() && kbForm.content.trim()) ? glassSuccess : glassSuccessDisabled}
                  >+ ナレッジを追加</button>
                </div>

                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
                    登録済みナレッジ（{knowledgeBase.length}件）
                  </div>
                  <div style={{ display: "grid", gap: 8, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                    {knowledgeBase.map(item => (
                      <div key={item.id} style={{
                        border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px",
                        background: "#f8fafc"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "#64748b" }}>{item.id}</span>
                          <Badge color="#059669">{item.disability}</Badge>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{item.topic}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
                          {item.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminMode === "history" && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "#0f3460" }}>
                  問い合わせ履歴管理
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                  同一問い合わせ者の案件を1つの履歴に集約して表示します。
                </p>
                {inquiryThreads.length === 0 ? (
                  <div style={{ padding: "20px 0", color: "#94a3b8", fontSize: 13 }}>
                    まだ履歴はありません。相談を公開するとここに追加されます。
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 14 }}>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, maxHeight: 360, overflowY: "auto" }}>
                      {inquiryThreads.map(thread => (
                        <button
                          key={thread.id}
                          onClick={() => setSelectedThreadId(thread.id)}
                          style={{
                            width: "100%", textAlign: "left", border: "none", background: selectedThreadId === thread.id ? "#eff6ff" : "#fff",
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
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, maxHeight: 360, overflowY: "auto", background: "#f8fafc" }}>
                      {(inquiryThreads.find(t => t.id === selectedThreadId) || inquiryThreads[0]).inquiries.map(item => (
                        <div key={item.id} style={{ background: "#fff", borderRadius: 8, padding: 10, marginBottom: 8, border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>{item.id}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(item.timestamp).toLocaleString("ja-JP")}</span>
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                            <strong>相談:</strong> {item.fullInquiry}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                            <strong>回答:</strong> {item.finalResponse.slice(0, 140)}{item.finalResponse.length > 140 ? "…" : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 0: Intake */}
            {adminMode === "workflow" && step === 0 && (
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
                  <button disabled={!inquiry.trim()} onClick={() => setStep(1)} style={inquiry.trim() ? glassPrimary : glassPrimaryDisabled}>次へ：属性設定 →</button>
                </div>
              </div>
            )}

            {/* Step 1: Metadata */}
            {adminMode === "workflow" && step === 1 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "#0f3460" }}>
                  ② 相談者の属性設定
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, gridColumn: "1 / -1" }}>
                    問い合わせ者名（任意）
                    <input
                      value={meta.requesterName}
                      onChange={e => setMeta({ ...meta, requesterName: e.target.value })}
                      placeholder="例：山田 花子"
                      style={inputStyle}
                    />
                  </label>
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
                          ...glassBase,
                          padding: "8px 18px", borderRadius: 22,
                          border: sel ? "1.5px solid rgba(37,99,235,.5)" : "1px solid rgba(226,232,240,.6)",
                          background: sel
                            ? "linear-gradient(135deg, rgba(37,99,235,.18) 0%, rgba(59,130,246,.12) 100%)"
                            : "rgba(255,255,255,.55)",
                          color: sel ? "#2563eb" : "#475569",
                          fontSize: 12, fontWeight: sel ? 700 : 500,
                          boxShadow: sel
                            ? "0 2px 12px rgba(37,99,235,.12), inset 0 1px 0 rgba(255,255,255,.4)"
                            : "0 1px 6px rgba(0,0,0,.03), inset 0 1px 0 rgba(255,255,255,.7)",
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
                    style={(meta.inquirer && meta.org && meta.disabilities.length > 0) ? glassPrimary : glassPrimaryDisabled}>次へ：AI回答生成 →</button>
                </div>
              </div>
            )}

            {/* Step 2: AI Draft */}
            {adminMode === "workflow" && step === 2 && (
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
                      <button onClick={() => setStep(3)} style={glassPrimary}>次へ：修正・確定 →</button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Edit & Confirm */}
            {adminMode === "workflow" && step === 3 && (
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
                  <button onClick={confirmResponse} style={glassSuccess}>✓ 確定して公開</button>
                </div>
              </div>
            )}

            {/* Step 4: Published */}
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
                      border: "1px solid #e2e8f0", textDecoration: "none",
                      cursor: "pointer", transition: "background .2s",
                    }}
                  >
                    🔗 {lastPublishedCase ? generateUrl(lastPublishedCase.id) : ""}
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
                  setMeta({ requesterName: "", inquirer: "", org: "", disabilities: [], skill: 3 });
                }} style={glassPrimary}>+ 新しい相談を受付</button>
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

const inputStyle = {
  display: "block", width: "100%", marginTop: 6, padding: "10px 12px",
  borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13,
  background: "#fff", color: "#1e293b", fontFamily: "inherit",
  boxSizing: "border-box"
};

// ── Liquid Glass button styles ──
const glassBase = {
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  borderRadius: 14,
  fontWeight: 600, fontSize: 13, cursor: "pointer",
  transition: "all .25s cubic-bezier(.4,0,.2,1)",
  letterSpacing: ".01em",
};

const glassPrimary = {
  ...glassBase,
  padding: "11px 28px",
  background: "linear-gradient(135deg, rgba(37,99,235,.72) 0%, rgba(59,130,246,.58) 100%)",
  border: "1px solid rgba(255,255,255,.35)",
  color: "#fff",
  boxShadow: "0 4px 24px rgba(37,99,235,.25), inset 0 1px 0 rgba(255,255,255,.3)",
};

const glassPrimaryDisabled = {
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

const glassSuccess = {
  ...glassBase,
  padding: "11px 28px",
  background: "linear-gradient(135deg, rgba(26,107,74,.72) 0%, rgba(22,163,74,.55) 100%)",
  border: "1px solid rgba(255,255,255,.3)",
  color: "#fff",
  boxShadow: "0 4px 24px rgba(26,107,74,.22), inset 0 1px 0 rgba(255,255,255,.25)",
};

const glassSuccessDisabled = {
  ...glassBase,
  padding: "11px 28px",
  background: "rgba(203,213,225,.45)",
  border: "1px solid rgba(203,213,225,.3)",
  color: "rgba(100,116,139,.6)",
  boxShadow: "none",
  cursor: "default",
};

const backBtnStyle = {
  ...glassBase,
  padding: "11px 20px",
  background: "rgba(255,255,255,.55)",
  border: "1px solid rgba(226,232,240,.7)",
  color: "#475569",
  boxShadow: "0 2px 12px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.6)",
};

const glassHeader = (active) => ({
  ...glassBase,
  padding: "7px 16px", borderRadius: 12, fontSize: 11,
  background: active ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.08)",
  border: active ? "1px solid rgba(255,255,255,.4)" : "1px solid rgba(255,255,255,.18)",
  color: "#fff",
  boxShadow: active ? "0 2px 16px rgba(255,255,255,.1), inset 0 1px 0 rgba(255,255,255,.2)" : "none",
});

const glassTab = (active) => ({
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
