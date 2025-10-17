import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isAlive: boolean;
}

interface ResultsOverlayProps {
  eliminatedPlayer: Player;
  votes: Record<string, string>;
  players: Player[];
  onContinue: () => void;
  onBackToLobby: () => void;
}

const ResultsOverlay: React.FC<ResultsOverlayProps> = ({
  eliminatedPlayer,
  votes,
  players,
  onContinue,
  onBackToLobby,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowOverlay(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-6 transition-opacity ${
        showOverlay ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-gray-900/90 rounded-3xl shadow-2xl max-w-4xl w-full p-6 flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-center">
          Resultados de la Votación
        </h2>

        {/* Jugadores */}
        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {players.map((player) => {
            const votedForId = votes[player.id];
            const votedFor = players.find((p) => p.id === votedForId);

            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-2 rounded-lg border-2 ${
                  player.id === eliminatedPlayer.id
                    ? "border-red-500 bg-red-600/30"
                    : "border-white/20"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                    player.isAlive ? "border-green-400" : "border-gray-500/50"
                  }`}
                >
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-bold ${
                      player.isAlive
                        ? "text-white"
                        : "text-gray-400 line-through"
                    }`}
                  >
                    {player.name}
                  </p>
                  {votedFor && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-300">Votó a:</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50">
                        <img
                          src={votedFor.avatar}
                          alt={votedFor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/*eliminado destacado */}
        {eliminatedPlayer && (
          <div className="flex flex-col items-center mt-4">
            <h3 className="text-2xl font-bold text-red-500 mb-2">
              Jugador Eliminado
            </h3>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-red-500">
              <img
                src={eliminatedPlayer.avatar}
                alt={eliminatedPlayer.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xl mt-2 text-white">{eliminatedPlayer.name}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 mt-6 justify-center">
          <Button
            onClick={onContinue}
            className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-xl font-bold"
          >
            Continuar
          </Button>
          <Button
            onClick={onBackToLobby}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-xl font-bold"
          >
            Volver al Lobby
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsOverlay;
