export const TOKEN_KEY = 'admin_token';

export function getToken (): string | null {
  try {
    // 先讀 localStorage，再讀 sessionStorage
    const fromLocal = window.localStorage.getItem(TOKEN_KEY);
    if (fromLocal) return fromLocal;
    const fromSession = window.sessionStorage.getItem(TOKEN_KEY);
    return fromSession;
  } catch {
    return null;
  }
}

export function setToken (token: string, remember = true) {
  try {
    if (remember) {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.sessionStorage.removeItem(TOKEN_KEY);
    } else {
      window.sessionStorage.setItem(TOKEN_KEY, token);
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function clearToken () {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
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


