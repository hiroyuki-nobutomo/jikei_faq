/**
 * 管理画面の認証シークレット管理。
 * localStorage に保存して全 admin API 呼び出しの Authorization ヘッダに付与する。
 */

const KEY = "jikei_admin_secret";

export function getAdminSecret() {
  return localStorage.getItem(KEY) || "";
}

export function setAdminSecret(secret) {
  localStorage.setItem(KEY, secret);
}

export function clearAdminSecret() {
  localStorage.removeItem(KEY);
}

export function adminHeaders() {
  const secret = getAdminSecret();
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}
