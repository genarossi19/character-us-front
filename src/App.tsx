import { Routes, Route } from "react-router";
import LoginScreen from "./pages/LoginScreen";
import { useNavigate } from "react-router";
import { useState } from "react";
import WaitingRoom from "./pages/WaitingRoom";
import QuickJoinScreen from "./pages/QuickJoinScreen";
import GameScreen from "./pages/GameScreen";
import VotingScreen from "./pages/VotingScreen";
import ResultsScreen from "./pages/ResultScreen";
import HomePage from "./pages/HomePage";
import SignupScreen from "./pages/SignupScreen";
import NotFound from "./pages/NotFound";
import Menu from "./pages/Menu";
import CreateRoomPage from "./pages/CreateRoomPage";

import PublicRoomsPage from "./pages/PublicRooms";
import { ThemeProvider } from "./components/theme-provider";
function App() {
  const [gameData, setGameData] = useState({
    roomCode: "123456",
    players: [
      {
        id: "1",
        name: "Alex",
        avatar: "/avatar1.webp",
        isHost: true,
        isReady: true,
        isAlive: true,
        character: "Detective",
        isImpostor: false,
      },
      {
        id: "2",
        name: "Maria",
        avatar: "/avatar2.webp",
        isHost: false,
        isReady: true,
        isAlive: true,
        character: "Médico",
        isImpostor: false,
      },
      {
        id: "3",
        name: "Carlos",
        avatar: "/avatar3.webp",
        isHost: false,
        isReady: true,
        isAlive: true,
        character: "Ingeniero",
        isImpostor: true,
      },
      {
        id: "4",
        name: "Sofia",
        avatar: "/avatar4.webp",
        isHost: false,
        isReady: true,
        isAlive: true,
        character: "Cocinero",
        isImpostor: false,
      },
    ],
    currentUser: {
      id: "1",
      name: "Alex",
      isHost: true,
      isAlive: true,
      character: "Detective",
      isImpostor: false,
      avatar: "/avatar1.webp",
    },
    votedPlayer: null, // jugador elegido en la votación
    eliminatedPlayer: {
      id: "2",
      name: "Maria",
      avatar: "/avatar2.webp",
      wasImpostor: false,
    },

    // Info de la partida
    category: "Disney",
    impostorCount: 1,
    impostorsKnowEachOther: true,
    minPlayers: 3,
  });

  const navigate = useNavigate();
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/signup" element={<SignupScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route index element={<HomePage />} />
          <Route path="/public-rooms" element={<PublicRoomsPage />} />

          <Route
            path="/lobby"
            element={
              <WaitingRoom
                gameData={gameData}
                onStartGame={() => navigate("/game")}
              />
            }
          />
          <Route
            path="/create"
            element={<CreateRoomPage onSubmit={() => navigate("/lobby")} />}
          />
          <Route
            path="/join"
            element={
              <QuickJoinScreen
                onJoin={() => navigate("/lobby")}
                onBack={() => navigate(-1)}
              />
            }
          />
          <Route
            path="/game"
            element={
              <GameScreen
                gameData={gameData}
                onSubmitVote={() => navigate("/results")}
                onStartVoting={() => navigate("/voting-screen")}
              />
            }
          />
          <Route
            path="/voting-screen"
            element={
              <VotingScreen
                players={gameData.players}
                onVote={() => navigate("results")}
              />
            }
          />
          <Route
            path="/results"
            element={
              <ResultsScreen
                onBackToLobby={() => navigate("/lobby")}
                eliminatedPlayer={gameData.eliminatedPlayer}
                onContinue={() => navigate("voting-screen")}
              />
            }
          />
          <Route path="/menu" element={<Menu />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </>
  );
}

export default App;
