import { Button } from "./components/ui/button";
import { Routes, Route } from "react-router";
import LoginScreen from "./pages/LoginScreen";
import { useNavigate } from "react-router";
import { useState } from "react";
import WaitingRoom from "./pages/WaitingRoom";
import QuickJoinScreen from "./pages/QuickJoinScreen";
import GameScreen from "./pages/GameScreen";
import VotingScreen from "./pages/VotingScreen";
import ResultsScreen from "./pages/ResultScreen";
function App() {
  const [gameData, setGameData] = useState({
    roomCode: "ABC123",
    players: [
      { id: "1", name: "Alex", avatar: "🎮", isHost: true, isReady: true },
      { id: "2", name: "Maria", avatar: "🌟", isHost: false, isReady: true },
      { id: "3", name: "Carlos", avatar: "🚀", isHost: false, isReady: true },
      { id: "4", name: "Sofia", avatar: "🎨", isHost: false, isReady: true },
    ],
    currentUser: { id: "1", name: "Alex", isHost: true },
    votedPlayer: null,
    eliminatedPlayer: {
      id: "2",
      name: "Maria",
      avatar: "🌟",
      wasImpostor: false,
    },
  });
  const navigate = useNavigate();
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <LoginScreen
              onLogin={() => navigate("/waiting-room")}
              onQuickJoin={() => navigate("/join")}
            />
          }
        />
        <Route
          path="/waiting-room"
          element={
            <WaitingRoom
              gameData={gameData}
              onStartGame={() => navigate("/lobby")}
            />
          }
        />
        <Route
          path="/join"
          element={
            <QuickJoinScreen
              onJoin={() => navigate("/waiting-room")}
              onBack={() => navigate(-1)}
            />
          }
        />
        <Route
          path="/lobby"
          element={
            <GameScreen
              gameData={gameData}
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
      </Routes>
    </>
  );
}

export default App;
