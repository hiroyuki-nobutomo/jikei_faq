/**
 * 問い合わせスレッド管理サービス
 *
 * 同一問い合わせ者のやり取りを1つのスレッドに集約する。
 * 実装時はDBの upsert 操作に置き換え。
 */

export function generateCaseId() {
  return "CASE-" + Date.now().toString(36).toUpperCase();
}

export function generateReplyUrl(caseId) {
  return `${window.location.origin}${window.location.pathname}#/reply/${caseId}`;
}

/**
 * 案件レコードを作成する。
 */
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

/**
 * 案件レコードをバックエンド（スプレッドシート）へ保存する非同期関数。
 */
export async function postCaseRecordToBackend(caseRecord) {
  try {
    const payload = {
      id: caseRecord.id,
      timestamp: caseRecord.timestamp,
      topic: caseRecord.meta.disabilities.join('、'),
      disability: caseRecord.meta.disabilities.join(', '),
      org: caseRecord.meta.org,
      status: "解決済み",
      initialInquiry: caseRecord.fullInquiry,
      latestReply: caseRecord.finalResponse
    };
    
    await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseRecord: payload })
    });
  } catch (error) {
    console.error('Failed to post case record to backend:', error);
  }
}


/**
 * スレッド一覧に案件を追加する。
 * 同名の問い合わせ者がいれば既存スレッドに追加、なければ新規スレッド作成。
 * @returns {{ threads: Array, newThreadId: string }}
 */
export function addCaseToThreads(threads, caseRecord) {
  const threadKey = caseRecord.requesterName === "未入力"
    ? `未入力-${caseRecord.id}`
    : caseRecord.requesterName;

  const existingIndex = threads.findIndex(t => t.requesterName === threadKey);

  if (existingIndex === -1) {
    const newThread = {
      id: "THREAD-" + Date.now().toString(36).toUpperCase(),
      requesterName: threadKey,
      inquiries: [caseRecord],
      updatedAt: caseRecord.timestamp
    };
    return {
      threads: [newThread, ...threads],
      newThreadId: newThread.id
    };
  }

  const updated = [...threads];
  const target = updated[existingIndex];
  const updatedThread = {
    ...target,
    inquiries: [...target.inquiries, caseRecord],
    updatedAt: caseRecord.timestamp
  };
  updated[existingIndex] = updatedThread;
  updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    threads: updated,
    newThreadId: updatedThread.id
  };
}
