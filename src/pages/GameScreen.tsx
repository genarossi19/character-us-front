import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import ChatComponent from "../components/ChatComponent";
import VotingPanel from "../components/VotingPanel";
import { AnimateIcon } from "../components/animate-ui/icons/icon";
// import { BotMessageSquare } from "lucide-react"; // not used
import { BotMessageSquareIcon } from "../components/animate-ui/icons/bot-message-square";
import { SquareKanban } from "../components/animate-ui/icons/square-kanban";
import { motion } from "motion/react";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isAlive: boolean;
  isImpostor: boolean;
  character: string;
}

const GameScreen: React.FC = () => {
  const [gameData] = useState({
    roomCode: "123456",
    currentUser: {
      id: "1",
      name: "Alex",
      avatar: "/avatar1.png",
      isAlive: true,
      isImpostor: false,
      character: "Detective",
    },
    players: [
      {
        id: "1",
        name: "Alex",
        avatar: "/avatar1.png",
        isAlive: true,
        isImpostor: false,
        character: "Detective",
      },
      {
        id: "2",
        name: "Maria",
        avatar: "/avatar2.png",
        isAlive: true,
        isImpostor: false,
        character: "Médico",
      },
      {
        id: "3",
        name: "Carlos",
        avatar: "/avatar3.png",
        isAlive: true,
        isImpostor: true,
        character: "Ingeniero",
      },
      {
        id: "4",
        name: "Sofia",
        avatar: "/avatar4.png",
        isAlive: true,
        isImpostor: false,
        character: "Cocinero",
      },
    ],
  });

  const { currentUser, players } = gameData;

  const [phase, setPhase] = useState<
    "waiting" | "voting" | "voteSummary" | "results"
  >("waiting");
  const [voteButtonEnabled, setVoteButtonEnabled] = useState(false);
  const [votingPanelOpen, setVotingPanelOpen] = useState(false);
  const [voteCountdown, setVoteCountdown] = useState(5);
  const [votingCountdown, setVotingCountdown] = useState(15);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const endVoting = useCallback(() => {
    setPhase("voteSummary");
    setTimeout(() => {
      const voteCounts: Record<string, number> = {};
      Object.values(votes).forEach((votedId) => {
        voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
      });
      const maxVotes = Math.max(...Object.values(voteCounts), 0);
      const eliminatedId = Object.keys(voteCounts).find(
        (id) => voteCounts[id] === maxVotes
      );
      const player = eliminatedId
        ? players.find((p) => p.id === eliminatedId) || null
        : null;
      setEliminatedPlayer(player);
      setPhase("results");
    }, 5000);
  }, [votes, players]);

  // Contador habilitación votación
  useEffect(() => {
    if (voteCountdown <= 0) {
      setVoteButtonEnabled(true);
      return;
    }
    const timer = setTimeout(() => setVoteCountdown(voteCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [voteCountdown]);

  // Contador votación
  useEffect(() => {
    if (!votingPanelOpen || votingCountdown <= 0) return;
    const timer = setTimeout(
      () => setVotingCountdown(votingCountdown - 1),
      1000
    );
    if (votingCountdown === 1) endVoting();
    return () => clearTimeout(timer);
  }, [votingCountdown, votingPanelOpen, endVoting]);

  const toggleVotingPanel = () => {
    if (!votingPanelOpen) {
      setPhase("voting");
      setVotingPanelOpen(true);
      setVotingCountdown(15);
      setSelectedVote(null);
      setVotes({});
    } else {
      setPhase("waiting");
      setVotingPanelOpen(false);
    }
  };

  const confirmVote = () => {
    if (!selectedVote) return;
    setVotes((prev) => ({ ...prev, [currentUser.id]: selectedVote }));
    setSelectedVote(null);
  };

  // endVoting is implemented above with useCallback

  return (
    <div className="flex h-screen bg-gray-900 text-white relative">
      {/* Main Left Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Espera / Personaje */}
        {phase === "waiting" && !votingPanelOpen && (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="w-96 h-96 rounded-full overflow-hidden border-4 border-white/20 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.character}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <h2 className="text-4xl font-bold">{currentUser.character}</h2>
            <p className="text-center text-lg text-gray-300">
              {currentUser.isImpostor
                ? "Eres el impostor. Tu objetivo es eliminar sin ser descubierto."
                : "Descubre al impostor y vota correctamente."}
            </p>
          </div>
        )}

        {/* Panel de votación */}
        {(phase === "voting" || phase === "voteSummary") && (
          <VotingPanel
            players={players}
            currentUserId={currentUser.id}
            phase={phase}
            votes={votes}
            selectedVote={selectedVote}
            setSelectedVote={setSelectedVote}
            confirmVote={confirmVote}
            endVoting={endVoting}
            votingCountdown={votingCountdown}
          />
        )}

        {/* Resultados */}
        {phase === "results" && eliminatedPlayer && (
          <div className="flex flex-col items-center gap-6 overflow-hidden">
            <h2 className="text-4xl font-bold text-red-500">
              Jugador Eliminado
            </h2>
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-red-500">
              <img
                src={eliminatedPlayer.avatar}
                alt={eliminatedPlayer.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-2xl font-semibold">{eliminatedPlayer.name}</p>
            <p
              className={`text-xl font-bold ${
                eliminatedPlayer.isImpostor ? "text-red-500" : "text-green-400"
              }`}
            >
              {eliminatedPlayer.isImpostor ? "Impostor" : "Tripulante"}
            </p>
            <Button
              onClick={() => {
                setPhase("waiting");
                setVotes({});
                setEliminatedPlayer(null);
                setVotingPanelOpen(false);
                setVoteButtonEnabled(false);
                setVoteCountdown(5);
                setVotingCountdown(15);
              }}
              className="mt-4 bg-green-500 hover:bg-green-600 px-6 py-2 rounded-2xl font-bold"
            >
              Continuar
            </Button>
          </div>
        )}
      </div>

      {/* Vote button: fixed, two distinct renders so AnimateIcon is NOT mounted during countdown */}
      <div
        className={`fixed z-50 pointer-events-auto top-4 ${
          chatOpen ? "right-[25rem]" : "right-22"
        }`}
      >
        {!voteButtonEnabled ? (
          // Static disabled button while counting down — NO AnimateIcon wrapper
          <button
            disabled
            className=" w-16 h-16 flex items-center justify-center bg-gray-700 text-gray-200/80 rounded-full shadow-lg"
            aria-label="Votación en espera"
          >
            <span className="text-sm leading-4">{voteCountdown}s</span>
          </button>
        ) : (
          // Animated button only when enabled
          <AnimateIcon animateOnHover loop>
            <button
              onClick={toggleVotingPanel}
              className="hover:cursor-pointer w-16 h-16 flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 rounded-full shadow-lg"
              aria-label="Abrir votación"
            >
              <SquareKanban />
            </button>
          </AnimateIcon>
        )}
      </div>

      {/* Chat button: only show when sheet is closed */}
      {!chatOpen && (
        <div className="fixed top-4 right-4 z-50 pointer-events-auto">
          <AnimateIcon animateOnHover>
            <button
              onClick={() => setChatOpen(true)}
              aria-expanded={chatOpen}
              aria-label="Abrir chat"
              className="hover:cursor-pointer w-16 h-16 flex items-center justify-center bg-accent hover:bg-secondary text-white rounded-full shadow-lg"
            >
              <BotMessageSquareIcon />
            </button>
          </AnimateIcon>
        </div>
      )}

      {/* Chat sheet (fixed to the right). Slides in/out without moving other fixed elements */}
      <div
        className={`fixed top-0 right-0 h-screen w-96 z-40 transform transition-transform duration-300 ${
          chatOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!chatOpen}
      >
        <div className="h-full flex flex-col border-l border-white/20 bg-transparent">
          <div className="flex-1 min-h-0">
            <ChatComponent onClose={() => setChatOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
