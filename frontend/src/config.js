/**
 * Frontend settings, read from Vite env vars (see .env.example).
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/**
 * The player whose progress is saved. There is no login yet, so every browser
 * plays as this seeded user; authentication would replace this setting.
 */
export const PLAYER_USERNAME = import.meta.env.VITE_PLAYER_USERNAME || "detective";
