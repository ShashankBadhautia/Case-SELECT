/**
 * Shared helpers for HTTP integration tests: boot the real Express app on an
 * ephemeral port and talk to it with cookies, exactly like a browser.
 */

export async function startServer() {
  const { default: app } = await import("../../src/app.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve) => {
        server.close(() => resolve());
        // Drop keep-alive connections from fetch so close() can finish.
        server.closeAllConnections?.();
      });
    },
  };
}

/** Extracts the first `name=value` pair of each Set-Cookie header. */
function cookiePairs(res) {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  return setCookies.map((cookie) => cookie.split(";")[0]);
}

export class Client {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookie = null;
  }

  async request(path, { method = "GET", body } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.cookie) headers.Cookie = this.cookie;

    const res = await fetch(this.baseUrl + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const pairs = cookiePairs(res);
    if (pairs.length > 0) {
      // Drop a cookie the server cleared (e.g. on logout).
      this.cookie = pairs.some((pair) => pair.includes("=;") || pair.endsWith("="))
        ? null
        : pairs.join("; ");
    }

    const payload = await res.json().catch(() => null);
    return { res, payload };
  }

  get(path) {
    return this.request(path);
  }

  post(path, body) {
    return this.request(path, { method: "POST", body });
  }

  put(path, body) {
    return this.request(path, { method: "PUT", body });
  }

  del(path) {
    return this.request(path, { method: "DELETE" });
  }
}

/** Unique, valid test username so reruns never collide with each other. */
export function uniqueName(prefix = "tester") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
