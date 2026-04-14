/**
 * AI回答生成サービス (Gemini版)
 *
 * バックエンド API (POST /api/generate) を呼び出し、
 * サーバー側で安全に保持されたAPIキーを利用して Gemini API から回答を得ます。
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
 * @param {Object} params.meta - 相談者メタ情報 (inquirer, org, disabilities, skill)
 * @param {Array}  params.knowledgeBase - 参照するナレッジベース
 * @returns {Promise<string>} 生成された回答テキスト
 */
export async function generateAIDraft({ inquiry, meta, knowledgeBase }) {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiry, meta, knowledgeBase }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    return data.draft || '（回答を生成できませんでした）';
  } catch (error) {
    console.error('Error in generateAIDraft:', error);
    throw error;
  }
}
