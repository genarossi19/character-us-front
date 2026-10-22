import { useEffect, type ReactNode } from "react";
import { Navigate, Routes, Route } from "react-router";
import LoginScreenV2 from "./pages/LoginScreenV2";
import SignupScreenV2 from "./pages/SignupScreenV2";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/theme-provider";
import RoomInactivityWarning from "./components/RoomInactivityWarning";

// V2 pages
import MenuV2 from "./pages/MenuV2";
import PublicRoomsV2 from "./pages/PublicRoomsV2";
import ProfileV2 from "./pages/ProfileV2";
import CreateRoomPageV2 from "./pages/CreateRoomPageV2";
import WaitingRoomV2 from "./pages/WaitingRoomV2";
import QuickJoinScreenV2 from "./pages/QuickJoinScreenV2";
import GameScreenV2 from "./pages/GameScreenV2";
import { useSocketGameEvents } from "./hooks/useSocketGame";
import { useUserStore } from "./store/useUserStore";
import { useSocketRoomEvents } from "./hooks/useSocketRoomEvents";
import { useRoomRecovery } from "./hooks/useRoomRecovery";
import { useRoomSessionStore } from "./store/useRoomSessionStore";
import RoomRecoveryScreen from "./components/RoomRecoveryScreen";

function SessionBootstrap() {
  const restoreSession = useUserStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return null;
}

function AuthenticatedOnlyRoute({ children }: { children: ReactNode }) {
  const isSessionReady = useUserStore((state) => state.isSessionReady);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  if (!isSessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="animate-pulse text-lg font-semibold text-muted-foreground">
          Validando tu sesión...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/join" replace />;
  }

  return children;
}

function App() {
  useSocketGameEvents();
  useSocketRoomEvents();
  const retryRecovery = useRoomRecovery();
  const recoveryStatus = useRoomSessionStore((state) => state.status);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SessionBootstrap />
      {recoveryStatus !== "idle" ? <RoomRecoveryScreen onRetry={retryRecovery} /> : <>
      <RoomInactivityWarning />
      <Routes>
        {/* Auth & Landing */}
        <Route path="/signup" element={<SignupScreenV2 />} />
        <Route path="/login" element={<LoginScreenV2 />} />
        <Route index element={<HomePage />} />

        {/* Main flow (V2) */}
        <Route
          path="/menu"
          element={
            <AuthenticatedOnlyRoute>
              <MenuV2 />
            </AuthenticatedOnlyRoute>
          }
        />
        <Route
          path="/public-rooms"
          element={
            <AuthenticatedOnlyRoute>
              <PublicRoomsV2 />
            </AuthenticatedOnlyRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthenticatedOnlyRoute>
              <ProfileV2 />
            </AuthenticatedOnlyRoute>
          }
        />

        {/* Room flow (V2) */}
        <Route
          path="/create"
          element={
            <AuthenticatedOnlyRoute>
              <CreateRoomPageV2 />
            </AuthenticatedOnlyRoute>
          }
        />
        <Route path="/join/:code?" element={<QuickJoinScreenV2 />} />
        <Route path="/lobby" element={<WaitingRoomV2 />} />

        {/* Game (V2) */}
        <Route path="/game" element={<GameScreenV2 />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </>}
    </ThemeProvider>
  );
}

export default App;
