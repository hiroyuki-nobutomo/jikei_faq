/**
 * AI回答生成サービス
 *
 * Vercel API Route (/api/generate) を経由して OpenAI API を呼び出す。
 * ブラウザから直接 OpenAI API を叩くとAPIキーが露出するため、
 * 必ずサーバーサイド経由とする。
 */

/**
 * ナレッジベースから相談内容に関連するエントリを検索する。
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
 * @returns {Promise<string>} 生成された回答テキスト
 */
export async function generateAIDraft({ inquiry, meta, knowledgeBase }) {
  const relevantKB = searchKnowledge(knowledgeBase, meta.disabilities);

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inquiry,
      meta,
      knowledgeEntries: relevantKB,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.draft;
}
