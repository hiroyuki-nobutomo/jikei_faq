import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `あなたは慈恵医科大学アクセシビリティ支援チームのAIアシスタントです。
障害のある方のICT（情報通信技術）活用に関する相談に、専門的かつ丁寧に回答してください。

## 回答のルール
- 相談者の立場（患者本人、家族、医療職など）に応じた言葉遣いを使う
- ICT習熟度に応じて専門用語の使用レベルを調整する（レベル1-2: 専門用語を避け平易に、レベル3-5: 効率的な応用テクニックも含む）
- 具体的な製品名・アプリ名・設定手順を示す
- 補装具費支給制度など利用可能な公的支援があれば言及する
- 回答は「■」で項目を区切り、読みやすく構造化する
- 参照ナレッジがある場合はそれを優先的に活用する
- ナレッジに該当がない場合は、一般知識で回答しつつ「担当者による確認をお勧めします」と注記する`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { inquiry, meta, knowledgeEntries } = req.body;

  if (!inquiry || !meta) {
    return res.status(400).json({ error: "inquiry and meta are required" });
  }

  let userPrompt = `## 相談内容\n${inquiry}\n\n`;
  userPrompt += `## 相談者情報\n`;
  userPrompt += `- 相談者タイプ: ${meta.inquirer}\n`;
  userPrompt += `- 所属: ${meta.org}\n`;
  userPrompt += `- 対象の障害種別: ${meta.disabilities.join("、")}\n`;
  userPrompt += `- ICT習熟度: レベル${meta.skill}（${meta.skill <= 2 ? "ほぼ未経験〜基本操作に支援が必要" : meta.skill <= 3 ? "基本操作は可能" : "日常的〜応用操作も可能"}）\n\n`;

  if (knowledgeEntries && knowledgeEntries.length > 0) {
    userPrompt += `## 参照ナレッジ\n`;
    knowledgeEntries.forEach(kb => {
      userPrompt += `### ${kb.topic}（${kb.disability}）\n${kb.content}\n\n`;
    });
  } else {
    userPrompt += `## 注意\n該当するナレッジが見つかりませんでした。一般知識で回答してください。\n\n`;
  }

  userPrompt += `上記を踏まえて、相談者に対する回答を作成してください。`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const draft = completion.choices[0].message.content;
    return res.status(200).json({ draft });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({
      error: "AI回答の生成に失敗しました",
      detail: error.message
    });
  }
}
