import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../api/client.js";
import { AuthContext } from "./AuthContext.js";

/**
 * Holds the signed-in player. On mount it asks the server who the session
 * cookie belongs to, so a page refresh (or reopening the browser) keeps the
 * player signed in. Nothing is stored in localStorage: the HttpOnly session
 * cookie is the only credential.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.auth
      .me()
      .then(({ user: me }) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        // 401 (or a network error) simply means "signed out".
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { user: me } = await api.auth.login(identifier, password);
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: me } = await api.auth.register(payload);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
