/** Short messages stacked above the prompt; GamePage removes them on a timer. */
export function Toasts({ toasts }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <p key={toast.id} className={`toast panel panel--thin toast--${toast.tone ?? "info"}`}>
          {toast.text}
        </p>
      ))}
    </div>
  );
}
