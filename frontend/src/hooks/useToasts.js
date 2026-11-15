import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_MS = 4000;

/** Returns [toasts, toast(text, tone)]; each toast disappears on its own. */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const timers = useRef(new Set());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const toast = useCallback((text, tone = "info") => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { id, text, tone }]);
    const timer = setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
      timers.current.delete(timer);
    }, TOAST_MS);
    timers.current.add(timer);
  }, []);

  return [toasts, toast];
}
