// client/src/api/docs.js
const API = import.meta.env.VITE_SERVER_URL || "http://localhost:5005";

/**
 * Fetch saved doc for roomId
 * returns { roomId, content, updatedAt } or throws
 */
export async function fetchDoc(roomId) {
  const res = await fetch(`${API}/api/docs/${encodeURIComponent(roomId)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch doc: ${res.status} ${text}`);
  }
  return res.json();
}

/**
 * Save doc content for roomId.
 * token optional: if provided, included in Authorization header.
 * Keepalive is used in browser unload fallback.
 */
export async function saveDoc(roomId, content, token = null, { keepalive = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Use fetch with keepalive to improve chance on page unload
  const res = await fetch(`${API}/api/docs/${encodeURIComponent(roomId)}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content }),
    keepalive,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save doc: ${res.status} ${text}`);
  }

  if (typeof window !== "undefined") {
  window.fetchDoc = fetchDoc;
  window.saveDoc = saveDoc;
}

  return res.json();
}
