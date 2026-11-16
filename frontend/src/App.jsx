import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider.jsx";
import { useAuth } from "./auth/useAuth.js";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { TitleScreen } from "./pages/TitleScreen.jsx";

// Phaser is large; load it only when a case is opened.
const GamePage = lazy(() => import("./pages/GamePage.jsx").then((m) => ({ default: m.GamePage })));

/** Gate for screens that need a signed-in player. */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="screen screen--center">
        <p className="loading">Checking your badge…</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <main className="screen screen--center">
            <p className="loading">Opening the case file…</p>
          </main>
        }
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* The title screen shows the intro to signed-out visitors and the
              case files to a signed-in player. */}
          <Route path="/" element={<TitleScreen />} />
          <Route
            path="/case/:caseId"
            element={
              <RequireAuth>
                <GamePage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
