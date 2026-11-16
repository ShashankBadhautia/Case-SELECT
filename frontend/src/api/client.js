import { API_BASE_URL } from "../config.js";

/**
 * Every call the frontend makes to the backend. One function per route; no
 * game rules live here, the server decides what a move means.
 */

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      // The session lives in an HttpOnly cookie; this is what sends it on
      // cross-origin requests (the dev server is :5173, the API is :3000).
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the case server. Is the backend running on port 3000?");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(payload?.message || payload?.error || `Request failed (${response.status})`, {
      status: response.status,
      body: payload,
    });
  }
  return payload;
}

const enc = encodeURIComponent;
const sessionPath = (userId, caseId) => `/api/users/${enc(userId)}/cases/${enc(caseId)}/session`;

export const api = {
  auth: {
    me: () => request("/api/auth/me"),
    login: (identifier, password) =>
      request("/api/auth/login", { method: "POST", body: { identifier, password } }),
    register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
    logout: () => request("/api/auth/logout", { method: "POST" }),
  },

  cases: {
    list: () => request("/api/cases"),
    /** Runs SQL without grading it (a terminal with no open question). */
    explore: (caseId, sql) => request(`/api/cases/${enc(caseId)}/sql`, { method: "POST", body: { sql } }),
  },

  players: {
    byUsername: (username) => request(`/api/users/by-username/${enc(username)}`),
    progress: (userId) => request(`/api/users/${enc(userId)}/progress`),
  },

  session: {
    get: (userId, caseId) => request(sessionPath(userId, caseId)),
    reset: (userId, caseId) => request(sessionPath(userId, caseId), { method: "DELETE" }),
    completeDialogue: (userId, caseId, sequenceId) =>
      request(`${sessionPath(userId, caseId)}/dialogue`, { method: "POST", body: { sequenceId } }),
    answer: (userId, caseId, sequenceId, sql) =>
      request(`${sessionPath(userId, caseId)}/answer`, { method: "POST", body: { sequenceId, sql } }),
    moveTo: (userId, caseId, locationId) =>
      request(`${sessionPath(userId, caseId)}/location`, { method: "PUT", body: { locationId } }),
  },
};
