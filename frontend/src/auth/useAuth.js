import { useContext } from "react";

import { AuthContext } from "./AuthContext.js";

/** The signed-in player: { id, username, email } | null, plus loading. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
