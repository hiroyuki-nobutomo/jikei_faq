import { readSheet, appendRow, updateRow, deleteRow } from "./_sheets.js";

const SHEET = "ナレッジ";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await readSheet(SHEET);
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { id, disability, topic, content } = req.body;
      if (!disability || !topic || !content) {
        return res.status(400).json({ error: "disability, topic, content are required" });
      }
      const newId = id || "KB-" + Date.now().toString(36).toUpperCase();
      await appendRow(SHEET, { id: newId, disability, topic, content });
      return res.status(201).json({ id: newId });
    }

    if (req.method === "PUT") {
      const { id, disability, topic, content } = req.body;
      if (!id) return res.status(400).json({ error: "id is required" });
      const updated = await updateRow(SHEET, id, { disability, topic, content });
      return res.status(updated ? 200 : 404).json({ ok: updated });
    }

    if (req.method === "DELETE") {
      const id = req.query.id || req.body?.id;
      if (!id) return res.status(400).json({ error: "id is required" });
      const deleted = await deleteRow(SHEET, id);
      return res.status(deleted ? 200 : 404).json({ ok: deleted });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Knowledge API error:", error);
    return res.status(500).json({ error: error.message });
  }
}
