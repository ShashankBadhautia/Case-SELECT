import { useCallback, useEffect, useState } from "react";

import { api } from "../api/client.js";

/**
 * Loads a player's session for one case and wraps the actions they can take.
 *
 * `session` holds what does not change while playing (case, locations, NPCs,
 * tables); `progress` is the server's answer to "where is the player now"
 * and is replaced after every action. When the server rejects a stale action
 * (409) it sends the real progress, which is applied before rethrowing.
 */
export function useCaseSession(caseId, userId) {
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId == null) return undefined;

    let cancelled = false;
    api.session
      .get(userId, caseId)
      .then(({ progress: initial, ...rest }) => {
        if (cancelled) return;
        setSession(rest);
        setProgress(initial);
      })
      .catch((err) => !cancelled && setError(err));
    return () => {
      cancelled = true;
    };
  }, [caseId, userId]);

  /** Runs an action, applies the progress it returns (or the 409 resync). */
  const perform = useCallback(async (action) => {
    try {
      const response = await action();
      if (response?.progress) setProgress(response.progress);
      return response;
    } catch (err) {
      if (err.body?.progress) setProgress(err.body.progress);
      throw err;
    }
  }, []);

  const actions = {
    completeDialogue: (sequenceId) => perform(() => api.session.completeDialogue(userId, caseId, sequenceId)),
    answer: (sequenceId, sql) => perform(() => api.session.answer(userId, caseId, sequenceId, sql)),
    moveTo: (locationId) => perform(() => api.session.moveTo(userId, caseId, locationId)),
    reset: () => perform(() => api.session.reset(userId, caseId)),
    explore: (sql) => api.cases.explore(caseId, sql),
  };

  return { session, progress, error, loading: !error && (!session || !progress), actions };
}
