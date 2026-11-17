/**
 * Frontend settings, read from Vite env vars (see .env.example).
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);
