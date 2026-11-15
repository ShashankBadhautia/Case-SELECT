import { useEffect, useRef } from "react";

/**
 * Calls handler(event) for keydown events whose `key` is in `keys`.
 * Pass enabled=false to stop listening (e.g. while another overlay is open).
 */
export function useKeyDown(keys, handler, enabled = true) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const keyList = keys.join("|");
  useEffect(() => {
    if (!enabled) return undefined;
    const wanted = new Set(keyList.split("|"));
    const onKeyDown = (event) => {
      if (wanted.has(event.key) && !event.repeat) handlerRef.current(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyList, enabled]);
}
