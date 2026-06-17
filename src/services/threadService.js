/**
 * 問い合わせスレッド管理サービス
 *
 * caseId は予測困難なランダム値を採用し、公開 URL から
 * 他案件を推測されるのを防ぐ。スレッド集約は api/cases.js 側で行う。
 */

export function generateCaseId() {
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return "CASE-" + random;
}

export function generateReplyUrl(caseId) {
  return `${window.location.origin}${window.location.pathname}#/reply/${caseId}`;
}

export function createCaseRecord({ caseId, inquiry, meta, finalResponse }) {
  return {
    id: caseId,
    requesterName: meta.requesterName.trim() || "未入力",
    inquiry: inquiry.slice(0, 60) + (inquiry.length > 60 ? "…" : ""),
    fullInquiry: inquiry,
    meta,
    finalResponse,
    url: generateReplyUrl(caseId),
    timestamp: new Date().toISOString()
  };
}
