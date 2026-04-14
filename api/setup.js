import { ensureSheet } from "./_sheets.js";

const KNOWLEDGE_HEADERS = ["id", "disability", "topic", "content"];
const CASES_HEADERS = ["id", "requesterName", "inquiry", "fullInquiry", "inquirer", "org", "disabilities", "skill", "finalResponse", "timestamp"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureSheet("ナレッジ", KNOWLEDGE_HEADERS);
    await ensureSheet("案件", CASES_HEADERS);
    return res.status(200).json({ ok: true, message: "シートを初期化しました" });
  } catch (error) {
    console.error("Setup error:", error);
    return res.status(500).json({ error: "シートの初期化に失敗しました", detail: error.message });
  }
}
