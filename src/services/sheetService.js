/**
 * Google Sheets API との通信サービス
 * Vercel API Routes を経由してスプレッドシートを読み書きする。
 */

// ── シート初期化 ──
export async function setupSheets() {
  const res = await fetch("/api/setup", { method: "POST" });
  if (!res.ok) throw new Error("シートの初期化に失敗しました");
  return res.json();
}

// ── ナレッジ ──
export async function fetchKnowledge() {
  const res = await fetch("/api/knowledge");
  if (!res.ok) throw new Error("ナレッジの取得に失敗しました");
  return res.json();
}

export async function addKnowledgeToSheet(entry) {
  const res = await fetch("/api/knowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("ナレッジの追加に失敗しました");
  return res.json();
}

export async function updateKnowledgeOnSheet(entry) {
  const res = await fetch("/api/knowledge", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("ナレッジの更新に失敗しました");
  return res.json();
}

export async function deleteKnowledgeFromSheet(id) {
  const res = await fetch(`/api/knowledge?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("ナレッジの削除に失敗しました");
  return res.json();
}

// ── 案件・スレッド ──
export async function fetchCasesAndThreads() {
  const res = await fetch("/api/cases");
  if (!res.ok) throw new Error("案件の取得に失敗しました");
  return res.json();
}

export async function addCaseToSheet(caseRecord) {
  const res = await fetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(caseRecord),
  });
  if (!res.ok) throw new Error("案件の保存に失敗しました");
  return res.json();
}
