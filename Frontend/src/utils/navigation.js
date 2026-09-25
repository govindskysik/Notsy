// Page navigation is intentionally centralized here. Using direct URLs keeps every
// workspace page independent and avoids stale data from a previously mounted route.
export const goTo = (path, { replace = false } = {}) => {
  if (!path || window.location.pathname === path) return;

  document.documentElement.classList.add("is-navigating");
  if (replace) {
    window.location.replace(path);
    return;
  }
  window.location.assign(path);
};

const CACHE_TTL = 5 * 60 * 1000;

export const readPageCache = (key) => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(key));
    if (!cached || Date.now() - cached.savedAt > CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
};

export const writePageCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Navigation should still work if browser storage is unavailable.
  }
};
