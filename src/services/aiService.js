/**
 * AI回答生成サービス
 *
 * 現在はモックシミュレーション。実装時は以下に差し替え:
 *   - バックエンド API (例: POST /api/generate) を呼び出し
 *   - バックエンドが Claude API + RAG (ベクトルDB検索) で回答を生成
 *   - ブラウザから直接 Anthropic API を呼ぶとCORS制限に抵触するため、
 *     必ずサーバーサイド経由とすること
 */

/**
 * ナレッジベースから相談内容に関連するエントリを検索する。
 * 実装時はベクトル検索 (embedding similarity) に置き換え。
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
  // TODO: 実装時は以下のようにバックエンドAPIを呼び出す
  // const res = await fetch('/api/generate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ inquiry, meta }),
  // });
  // const data = await res.json();
  // return data.draft;

  // ── モックシミュレーション ──
  await new Promise(resolve => setTimeout(resolve, 2000));

  const relevantKB = searchKnowledge(knowledgeBase, meta.disabilities);

  let text = `【AIによる回答原案（デモ用シミュレーション）】\n\n`;
  text += `本日はご相談ありがとうございます。`;
  text += `${meta.inquirer}様のお問い合わせ内容につきまして、以下の通りご案内いたします。\n\n`;

  if (relevantKB.length > 0) {
    text += `ご指定の障害（${meta.disabilities.join("・")}）に対して、当チームのナレッジから以下の解決策を提案します。\n\n`;
    relevantKB.forEach(kb => {
      text += `■ ${kb.topic}\n${kb.content}\n\n`;
    });
    text += `相談者様のICT習熟度（レベル${meta.skill}）に基づき、`;
    text += meta.skill <= 2
      ? "専門用語を避けた丁寧な操作説明"
      : "効率的な応用テクニック";
    text += "も併せて提供可能です。実際の操作にあたってご不明点があればいつでもお問い合わせください。";
  } else {
    text += "申し訳ありません。現在のデータベースには、ご指定の条件に直接該当する有効な情報が登録されていません。\n\n";
    text += "※この領域は担当者による確認をお勧めします。";
  }

  return text;
}
