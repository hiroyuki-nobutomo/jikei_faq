/**
 * 管理 API の認証ヘルパ。
 * Authorization: Bearer <ADMIN_SECRET> を検証する。
 * 検証失敗時はレスポンスを送出して false を返す。
 */
export function requireAdmin(req, res) {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    console.error("ADMIN_SECRET is not configured");
    res.status(500).json({ error: "サーバ設定エラー" });
    return false;
  }
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match || match[1] !== expected) {
    res.status(401).json({ error: "認証が必要です" });
    return false;
  }
  return true;
}
