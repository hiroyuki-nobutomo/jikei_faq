/**
 * AI回答生成サービス
 *
 * Vercel API Route (/api/generate) を経由して OpenAI API を呼び出す。
 * ブラウザから直接 OpenAI API を叩くとAPIキーが露出するため、
 * 必ずサーバーサイド経由とする。
 * 管理操作のため Authorization: Bearer <ADMIN_SECRET> を付与する。
 */

import { adminHeaders } from "./auth";

/**
 * ナレッジベースから相談内容に関連するエントリを検索する。
 * `disabilities` が空配列の場合は **全件返す**（属性未確定時の保険）。
 * 通常フローでは Step1 で 1 つ以上選択しないと Step2 へ進めないため到達しない。
 * 将来的にはベクトル検索 (embedding similarity) に置き換え可能。
 */
export function searchKnowledge(knowledgeBase, disabilities) {
  return knowledgeBase.filter(
    kb => disabilities.some(d => kb.disability === d) || disabilities.length === 0
  );
}

/**
 * AI回答の原案を生成する。
 * @param {Object} params
 * @param {string} params.inquiry - 相談内容テキスト
 * @param {Object} params.meta - 相談者メタ情報
 * @param {Array}  params.knowledgeBase - 参照するナレッジベース
 * @returns {Promise<{draft: string, needsEscalation: boolean}>}
 *   `draft`: 生成された回答テキスト
 *   `needsEscalation`: ナレッジ不足によるエスカレーション判定（サーバ側で判定済み）
 */
export async function generateAIDraft({ inquiry, meta, knowledgeBase }) {
  const relevantKB = searchKnowledge(knowledgeBase, meta.disabilities);

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({
      inquiry,
      meta,
      knowledgeEntries: relevantKB,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `API error: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return { draft: data.draft, needsEscalation: !!data.needsEscalation };
}
