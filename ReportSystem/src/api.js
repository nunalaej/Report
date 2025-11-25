// src/api.js

const API_BASE = "http://localhost:3000";

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    console.error("Failed to parse JSON:", err);
  }

  return data;
}

const api = {
  post: (path, body) => request("POST", path, body),
};

export default api;
