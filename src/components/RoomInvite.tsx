import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RoomInvite({ code, isPrivate = false }: { code: number; isPrivate?: boolean }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState("");
  const networkOrigin = document.querySelector<HTMLMetaElement>('meta[name="room-invite-network-origin"]')?.content;
  const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
  const origin = isLocalhost && networkOrigin ? networkOrigin : window.location.origin;
  const invitation = new URL("/", origin);
  invitation.searchParams.set("code", String(code));
  const inviteUrl = invitation.href;

  const copy = async (kind: "code" | "link") => {
    setError("");
    setCopied(null);
    try {
      await navigator.clipboard.writeText(kind === "code" ? String(code) : inviteUrl);
      setCopied(kind);
    } catch {
      setError("No se pudo copiar. Selecciona el código o el enlace para compartirlo.");
    }
  };

  const share = async () => {
    setError("");
    try {
      await navigator.share({ title: "¡Vamos a jugar a CharacterUs!", text: `Únete a mi partida. Código: ${code}`, url: inviteUrl });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      await copy("link");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Código de sala</p>
          <p className="select-all text-3xl font-semibold tracking-[0.15em] text-foreground">{code}</p>
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={() => void copy("code")} aria-label={`Copiar código de sala ${code}`} className="size-10 shrink-0 text-teal-700 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100">
          {copied === "code" ? <Check className="size-5" /> : <Copy className="size-5" />}
        </Button>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0 overflow-hidden rounded-lg border border-border bg-white p-1">
          <QRCodeSVG value={inviteUrl} size={88} level="M" marginSize={2} title={`Escanea para entrar a la sala ${code}`} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" variant="outline" className="min-w-0 flex-1 px-2 text-base" onClick={() => void copy("link")}>
              {copied === "link" ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}{copied === "link" ? "Copiado" : "Copiar enlace"}
            </Button>
            {typeof navigator.share === "function" && <Button type="button" size="icon" variant="outline" className="size-10 shrink-0" aria-label="Compartir invitación" onClick={() => void share()}><Share2 className="size-5" /></Button>}
          </div>
        </div>
      </div>
      {error && <input aria-label="Enlace de invitación" readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} className="block h-8 w-full min-w-0 rounded-sm border border-border bg-transparent px-2 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />}
      {isPrivate && <p className="flex items-start gap-2 text-xs leading-snug text-muted-foreground">Comparte la contraseña por separado.</p>}
      <p role={error ? "alert" : "status"} className={error ? "text-sm text-red-700 dark:text-red-300" : "sr-only"}>{error || (copied === "code" ? "Código copiado" : copied === "link" ? "Enlace de invitación copiado" : "")}</p>
    </div>
  );
}
