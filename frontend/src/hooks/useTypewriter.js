import { useEffect, useState } from "react";

const CHARS_PER_SECOND = 55;

/**
 * Reveals `text` a few characters at a time.
 * Returns [visibleText, done, skip]; skip() shows the whole text at once.
 */
export function useTypewriter(text) {
  const [shown, setShown] = useState({ text, count: 0 });

  // Restart when the text changes (derived during render, no effect needed).
  if (shown.text !== text) setShown({ text, count: 0 });

  const done = shown.count >= text.length;

  useEffect(() => {
    if (done) return undefined;
    const timer = setInterval(
      () => setShown((s) => ({ ...s, count: Math.min(s.count + 1, s.text.length) })),
      1000 / CHARS_PER_SECOND,
    );
    return () => clearInterval(timer);
  }, [done, text]);

  const skip = () => setShown((s) => ({ ...s, count: s.text.length }));
  return [text.slice(0, shown.count), done, skip];
}
