export const TOKEN_KEY = 'admin_token';

export function getToken (): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken (token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearToken () {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function fetchWithAuth (input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    // 401 自動登出
    clearToken();
  }
  return response;
}


