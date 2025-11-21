import { getCurrentUser, logout } from "./auth";

const BASE_URL = "http://localhost:3000";

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const user = getCurrentUser();
  const token = user?.token; // if you have a real token, store it in currentUser.token

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body,
  });

    // Force-redirect on 401 or 403
  if (res.status === 401 || res.status === 403) {
    logout();
    // hard redirect so it always works outside React as well
    window.location.replace("/login");
    throw new Error("Unauthorized");
  }

  // try to parse JSON if available
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text;
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  del: (path) => request(path, { method: "DELETE" }),
};
