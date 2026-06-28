const STORAGE_KEY = "loom-theme";

export function getThemePreference() {
  return localStorage.getItem(STORAGE_KEY) || "dark";
}

export function resolveTheme(preference = getThemePreference()) {
  if (preference === "auto") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return preference === "light" ? "light" : "dark";
}

export function applyTheme(preference = getThemePreference()) {
  const resolved = resolveTheme(preference);
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.dataset.themePreference = preference;
  return resolved;
}

export function setThemePreference(preference) {
  localStorage.setItem(STORAGE_KEY, preference);
  return applyTheme(preference);
}

export function initTheme() {
  return applyTheme(getThemePreference());
}
