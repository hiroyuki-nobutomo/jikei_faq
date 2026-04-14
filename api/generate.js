import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { inquiry, meta, knowledgeBase } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const relevantKB = knowledgeBase.filter(
      kb => meta.disabilities.some(d => kb.disability === d) || meta.disabilities.length === 0
    );

    const systemPrompt = `あなたは東京慈恵会医科大学の「アクセシビリティAI相談システム」の専門コンサルタントです。
以下の属性のユーザーから寄せられた相談に対して、ナレッジベース内の情報を活用しながら丁寧な回答案を作成してください。

【相談者の属性】
- 種別: ${meta.inquirer}
- 所属: ${meta.org}
- 障害: ${meta.disabilities.join('、')}
- ICT習熟度: レベル${meta.skill} (1:未経験 〜 5:応用可能)

【抽出されたナレッジベース情報】
${relevantKB.map(kb => `[トピック: ${kb.topic}]\n${kb.content}`).join('\n\n')}

【指示】
1. 回答は暖かく、共感的でプロフェッショナルなトーンを維持すること。
2. ナレッジベースの内容がある場合は、それを積極的に活用して解決策を提案すること。
3. ナレッジベースの情報では不足している場合や、エスカレーションが必要と感じる場合は、その旨を回答末尾に「※この領域は担当チームにご相談ください」等と記載すること。
4. ICT習熟度に合わせた言葉遣い（レベル1〜2なら専門用語は使わず優しく、レベル4〜5なら効率的な方法を具体的に）で説明すること。
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: systemPrompt });

    const result = await model.generateContent(inquiry);
    const response = await result.response;
    const text = response.text();

    res.json({ draft: text });
  } catch (error) {
    console.error('Error generating AI text:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
}
