const API_UNAVAILABLE =
  "The advisor API isn't responding. Run npm run dev to start the frontend and backend together.";

/**
 * @param {Response} res
 * @returns {Promise<Record<string, unknown>>}
 */
export async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(API_UNAVAILABLE);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      "The advisor API returned an invalid response. Try restarting with npm run dev."
    );
  }
}

/**
 * @param {unknown} err
 * @returns {string}
 */
export function friendlyApiError(err) {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";

  if (/failed to fetch|networkerror|network error|load failed/i.test(message)) {
    return API_UNAVAILABLE;
  }
  if (message) {
    return message;
  }
  return "Something went wrong. Please try again.";
}
