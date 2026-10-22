import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function RoomInvite({ code }: { code: number }) {
  const networkOrigin = document.querySelector<HTMLMetaElement>(
    'meta[name="room-invite-network-origin"]'
  )?.content;
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  const origin = isLocalhost && networkOrigin ? networkOrigin : window.location.origin;
  const inviteUrl = new URL(`/join/${code}`, origin).href;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Enlace de invitación copiado");
    } catch {
      toast.error("No se pudo copiar. Puedes seleccionar el enlace que aparece junto al QR.");
    }
  };

  return (
    <div className="flex max-w-sm items-center gap-3 rounded-xl bg-card p-3 text-left text-foreground shadow-lg">
      <a href={inviteUrl} aria-label={`Entrar a la sala ${code}`} className="shrink-0 rounded bg-white">
        <QRCodeSVG
          value={inviteUrl}
          size={144}
          level="M"
          marginSize={4}
          title={`Escanea para entrar a la sala ${code}`}
        />
      </a>
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-semibold">Escanea para unirte</p>
        <a href={inviteUrl} className="block break-all text-xs text-muted-foreground underline">
          {inviteUrl}
        </a>
        <Button size="sm" variant="outline" onClick={copyInvite}>Copiar enlace</Button>
      </div>
    </div>
  );
}
