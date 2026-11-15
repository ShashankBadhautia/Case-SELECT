import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { TitleScreen } from "./pages/TitleScreen.jsx";

// Phaser is large; load it only when a case is opened.
const GamePage = lazy(() => import("./pages/GamePage.jsx").then((m) => ({ default: m.GamePage })));

export default function App() {
  return (
    <Suspense
      fallback={
        <main className="screen screen--center">
          <p className="loading">Opening the case file…</p>
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/case/:caseId" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
