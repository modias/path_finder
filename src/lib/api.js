/**
 * Same-origin API paths (proxied to Express in dev/preview).
 * Avoids cross-origin blocks in embedded browser previews.
 * @param {string} path
 * @returns {string}
 */
export function apiUrl(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export function apiFetch(path, options) {
  return fetch(apiUrl(path), options);
}
