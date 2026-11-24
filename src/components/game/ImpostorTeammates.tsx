import { useGameStore } from "@/store/useGameStore";
import { useRoomStore } from "@/store/useRoomStore";

export default function ImpostorTeammates() {
  const { isImpostor, impostorIds } = useGameStore();
  const { room, currentPlayer, players } = useRoomStore();
  if (!isImpostor || !room?.settings.impostorsKnowEachOther || room.settings.mode === "anonymous") return null;
  const teammates = players.filter((player) => player.socketId !== currentPlayer?.socketId && impostorIds.includes(player.socketId));
  if (!teammates.length) return null;
  return <p className="mt-1 text-sm text-impostor">{teammates.length === 1 ? "Tu compañero impostor: " : "Tus compañeros impostores: "}{teammates.map((player) => player.username).join(", ")}</p>;
}
