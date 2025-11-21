// Simple localStorage-based auth helpers
const STORAGE_KEY = "currentUser";

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getCurrentUser();
}

export function loginAs(userObj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.clear();
}
