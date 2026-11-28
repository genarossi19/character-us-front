import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isMuted, toggleSound } from "@/lib/sounds";

function subscribe(refresh: () => void) {
  window.addEventListener("sound-preference", refresh);
  window.addEventListener("storage", refresh);
  return () => {
    window.removeEventListener("sound-preference", refresh);
    window.removeEventListener("storage", refresh);
  };
}
export function SoundToggle() {
  const muted = useSyncExternalStore(subscribe, isMuted);
  const label = muted ? "Activar sonido" : "Silenciar sonido";
  return <Button type="button" variant="ghost" size="icon" data-sound-toggle aria-label={label} title={label} onClick={toggleSound}>
    {muted ? <VolumeX /> : <Volume2 />}
  </Button>;
}
