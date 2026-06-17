import { readSheet, appendRow } from "./_sheets.js";
import { requireAdmin } from "./_auth.js";

const SHEET = "案件";

function rowToCase(r) {
  return {
    id: r.id,
    requesterName: r.requesterName,
    inquiry: r.inquiry,
    fullInquiry: r.fullInquiry,
    meta: {
      requesterName: r.requesterName,
      inquirer: r.inquirer,
      org: r.org,
      disabilities: r.disabilities ? r.disabilities.split(",") : [],
      skill: Number(r.skill) || 3,
    },
    finalResponse: r.finalResponse,
    timestamp: r.timestamp,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // 個別取得（公開ビュー用、無認証）— caseId は予測困難なため許可
      const { id } = req.query;
      if (id) {
        const rows = await readSheet(SHEET);
        const row = rows.find(r => r.id === id);
        if (!row) return res.status(404).json({ error: "案件が見つかりません" });
        return res.status(200).json({ case: rowToCase(row) });
      }

      // 全件取得（管理用）— 認証必須
      if (!requireAdmin(req, res)) return;

      const rows = await readSheet(SHEET);
      const cases = rows.map(rowToCase);

      // スレッド集約: 同一 requesterName をグルーピング
      const threadMap = new Map();
      cases.forEach(c => {
        const key = c.requesterName || `未入力-${c.id}`;
        if (!threadMap.has(key)) {
          threadMap.set(key, {
            id: "THREAD-" + key.replace(/\s/g, ""),
            requesterName: key,
            inquiries: [],
            updatedAt: c.timestamp,
          });
        }
        const thread = threadMap.get(key);
        thread.inquiries.push(c);
        if (c.timestamp > thread.updatedAt) thread.updatedAt = c.timestamp;
      });

      const threads = [...threadMap.values()].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return res.status(200).json({ cases, threads });
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) return;

      const { id, requesterName, inquiry, fullInquiry, meta, finalResponse, timestamp } = req.body;
      if (!id || !finalResponse) {
        return res.status(400).json({ error: "id and finalResponse are required" });
      }
      await appendRow(SHEET, {
        id,
        requesterName: requesterName || "未入力",
        inquiry: inquiry || "",
        fullInquiry: fullInquiry || "",
        inquirer: meta?.inquirer || "",
        org: meta?.org || "",
        disabilities: (meta?.disabilities || []).join(","),
        skill: String(meta?.skill || 3),
        finalResponse,
        timestamp: timestamp || new Date().toISOString(),
      });
      return res.status(201).json({ id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Cases API error:", error);
    return res.status(500).json({ error: "案件処理でエラーが発生しました" });
  }
}
