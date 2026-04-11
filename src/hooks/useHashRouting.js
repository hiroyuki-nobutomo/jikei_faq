import { useState, useEffect, useCallback } from "react";

/**
 * ハッシュベースのルーティングフック。
 * #/reply/{caseId} 形式のURLを解析し、表示すべきケースIDを返す。
 *
 * 実装時は React Router 等に置き換え可能。
 */
export function useHashRouting() {
  const [viewMode, setViewMode] = useState("admin");
  const [viewCaseId, setViewCaseId] = useState(null);

  const handleHashChange = useCallback(() => {
    const match = window.location.hash.match(/^#\/reply\/(.+)$/);
    if (match) {
      setViewCaseId(match[1]);
      setViewMode("public");
    }
  }, []);

  useEffect(() => {
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [handleHashChange]);

  const switchToPublic = useCallback((caseId) => {
    if (caseId) {
      window.location.hash = `/reply/${caseId}`;
      setViewCaseId(caseId);
    }
    setViewMode("public");
  }, []);

  const switchToAdmin = useCallback(() => {
    window.location.hash = "";
    setViewCaseId(null);
    setViewMode("admin");
  }, []);

  return { viewMode, viewCaseId, switchToPublic, switchToAdmin };
}
