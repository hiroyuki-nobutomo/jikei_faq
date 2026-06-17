/**
 * Google Sheets API との通信サービス
 * Vercel API Routes を経由してスプレッドシートを読み書きする。
 *
 * 管理用エンドポイント (setup / knowledge / cases 全件・POST) は
 * Authorization: Bearer <ADMIN_SECRET> を付与する。
 * 公開ビュー用 fetchCaseById のみ無認証。
 */

import { adminHeaders } from "./auth";

function jsonHeaders() {
  return { "Content-Type": "application/json", ...adminHeaders() };
}

function throwForStatus(res, fallback) {
  const err = new Error(fallback);
  err.status = res.status;
  throw err;
}

// ── シート初期化 ──
export async function setupSheets() {
  const res = await fetch("/api/setup", { method: "POST", headers: adminHeaders() });
  if (!res.ok) throwForStatus(res, "シートの初期化に失敗しました");
  return res.json();
}

// ── ナレッジ ──
export async function fetchKnowledge() {
  const res = await fetch("/api/knowledge", { headers: adminHeaders() });
  if (!res.ok) throwForStatus(res, "ナレッジの取得に失敗しました");
  return res.json();
}

export async function addKnowledgeToSheet(entry) {
  const res = await fetch("/api/knowledge", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(entry),
  });
  if (!res.ok) throwForStatus(res, "ナレッジの追加に失敗しました");
  return res.json();
}

export async function updateKnowledgeOnSheet(entry) {
  const res = await fetch("/api/knowledge", {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(entry),
  });
  if (!res.ok) throwForStatus(res, "ナレッジの更新に失敗しました");
  return res.json();
}

export async function deleteKnowledgeFromSheet(id) {
  const res = await fetch(`/api/knowledge?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throwForStatus(res, "ナレッジの削除に失敗しました");
  return res.json();
}

// ── 案件・スレッド（管理用、全件取得）──
export async function fetchCasesAndThreads() {
  const res = await fetch("/api/cases", { headers: adminHeaders() });
  if (!res.ok) throwForStatus(res, "案件の取得に失敗しました");
  return res.json();
}

export async function addCaseToSheet(caseRecord) {
  const res = await fetch("/api/cases", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(caseRecord),
  });
  if (!res.ok) throwForStatus(res, "案件の保存に失敗しました");
  return res.json();
}

// ── 個別案件取得（公開ビュー用、無認証）──
export async function fetchCaseById(id) {
  const res = await fetch(`/api/cases?id=${encodeURIComponent(id)}`);
  if (!res.ok) throwForStatus(res, "案件の取得に失敗しました");
  const data = await res.json();
  return data.case;
}
