// client/src/api/auth.js
const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export async function register({ email, password, displayName }) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, displayName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "register failed");
  return data; // { token, user }
}

export async function login({ email, password }) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "login failed");
  return data; // { token, user }
}

export async function me(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API}/api/auth/me`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "not authenticated");
  }
  const data = await res.json();
  return data; // { id, email, displayName, avatar }
}
