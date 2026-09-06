import { Routes, Route } from "react-router";
import LoginScreenV2 from "./pages/LoginScreenV2";
import SignupScreenV2 from "./pages/SignupScreenV2";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "./components/theme-provider";

// V2 pages
import MenuV2 from "./pages/MenuV2";
import PublicRoomsV2 from "./pages/PublicRoomsV2";
import ProfileV2 from "./pages/ProfileV2";
import CreateRoomPageV2 from "./pages/CreateRoomPageV2";
import WaitingRoomV2 from "./pages/WaitingRoomV2";
import QuickJoinScreenV2 from "./pages/QuickJoinScreenV2";
import GameScreenV2 from "./pages/GameScreenV2";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        {/* Auth & Landing */}
        <Route path="/signup" element={<SignupScreenV2 />} />
        <Route path="/login" element={<LoginScreenV2 />} />
        <Route index element={<HomePage />} />

        {/* Main flow (V2) */}
        <Route path="/menu" element={<MenuV2 />} />
        <Route path="/public-rooms" element={<PublicRoomsV2 />} />
        <Route path="/profile" element={<ProfileV2 />} />

        {/* Room flow (V2) */}
        <Route path="/create" element={<CreateRoomPageV2 />} />
        <Route path="/join" element={<QuickJoinScreenV2 />} />
        <Route path="/lobby" element={<WaitingRoomV2 />} />

        {/* Game (V2) */}
        <Route path="/game" element={<GameScreenV2 />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
