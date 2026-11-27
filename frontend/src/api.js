const TOKEN_KEY = 'peoplecorps-token';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token) { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); }

export async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  const token = options.auth === false ? null : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`/api${path}`, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  let result;
  try { result = await response.json(); } catch { result = {}; }
  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      setToken(null);
      window.dispatchEvent(new Event('peoplecorps:session-expired'));
    }
    throw new Error(result.error?.message || `Request failed (${response.status})`);
  }
  return result;
}

export function hasPermission(user, moduleName, action = 'view') {
  const permissions = user?.role?.permissions;
  const modulePermissions = permissions?.[moduleName] ?? permissions?.get?.(moduleName);
  return Boolean(modulePermissions?.[action]);
}
