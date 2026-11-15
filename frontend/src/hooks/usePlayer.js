import { useEffect, useState } from "react";

import { api } from "../api/client.js";
import { PLAYER_USERNAME } from "../config.js";

/**
 * Resolves the configured player to their database id.
 * Returns { player, error }; both are null while loading.
 */
export function usePlayer() {
  const [state, setState] = useState({ player: null, error: null });

  useEffect(() => {
    let cancelled = false;
    api.players
      .byUsername(PLAYER_USERNAME)
      .then((player) => !cancelled && setState({ player, error: null }))
      .catch((error) => !cancelled && setState({ player: null, error }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
