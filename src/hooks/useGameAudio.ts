import { useEffect } from "react";
import { playSound, unlockSound } from "@/lib/sounds";
import { onGameStarted, onGameEnded, onTurnChanged, onPhaseChanged, onChatMessage, onVoteUpdate } from "@/services/socket/listeners/gameListeners";
import { useRoomStore } from "@/store/useRoomStore";

export function useGameAudio() {
  useEffect(() => {
    const me = () => useRoomStore.getState().currentPlayer?.socketId;
    function click(event: MouseEvent) {
      unlockSound();
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest("button,a[href],[role=option],[role=menuitem],[role=radio],[role=switch]");
      if (!control || control.matches(":disabled,[aria-disabled=true],[data-sound-toggle],[data-chat-send]")) return;
      playSound(control.matches("[role=option],[role=radio],[role=switch],[role=combobox]") ? "select" : "click");
    }
    document.addEventListener("pointerdown", unlockSound, true);
    document.addEventListener("touchend", unlockSound, true);
    document.addEventListener("keydown", unlockSound, true);
    document.addEventListener("click", click, true);
    const cleanups = [
      onGameStarted(() => playSound("start")),
      onGameEnded(({winner}) => playSound(winner === "impostor" ? "impostor" : "innocent")),
      onPhaseChanged(({phase}) => { if (phase === "debate" || phase === "voting") playSound(phase); }),
      onTurnChanged(({playerId}) => { if (playerId === me()) playSound("turn"); }),
      onVoteUpdate(({voterId}) => { if (voterId === me()) playSound("vote"); }),
      onChatMessage(msg => { if (msg.type !== "system") playSound(msg.senderId === me() ? "sent" : "message"); }),
    ];
    return () => {
      document.removeEventListener("pointerdown", unlockSound, true);
      document.removeEventListener("touchend", unlockSound, true);
      document.removeEventListener("keydown", unlockSound, true);
      document.removeEventListener("click", click, true);
      cleanups.forEach(clean => clean());
    };
  }, []);
}
