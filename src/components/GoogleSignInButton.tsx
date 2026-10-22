import { useEffect, useRef, useState } from "react";
import { loadGoogleIdentity, renderGoogleButton } from "@/services/auth/googleIdentity";
import { Button } from "@/components/ui/button";

export default function GoogleSignInButton({ onCredential, disabled, mode = "login" }: { onCredential: (credential: string) => void; disabled: boolean; mode?: "login" | "register" }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const blocked = useRef(disabled);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  useEffect(() => { callback.current = onCredential; blocked.current = disabled; }, [onCredential, disabled]);
  useEffect(() => {
    if (!clientId) return;
    let active = true;
    let cleanup: (() => void) | undefined;
    loadGoogleIdentity().then((identity) => {
      if (!active || !container.current) return;
      cleanup = renderGoogleButton(identity, container.current, clientId, (credential) => {
        if (!blocked.current) callback.current(credential);
      }, mode === "register" ? "signup_with" : "continue_with");
      setReady(true);
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : "Google no está disponible.");
    });
    return () => { active = false; cleanup?.(); };
  }, [clientId, attempt, mode]);

  if (!clientId) return <p className="text-center text-sm text-muted-foreground">El acceso con Google aún no está disponible.</p>;
  return (
    <div className="space-y-2">
      <div ref={container} inert={disabled} aria-disabled={disabled} aria-label={mode === "register" ? "Registrarse con Google" : "Continuar con Google"} className={`flex min-h-10 w-full justify-center ${disabled ? "opacity-50" : ""}`} />
      {!ready && !error && <p role="status" className="text-center text-sm text-muted-foreground">Cargando Google…</p>}
      {error && <div className="text-center"><p role="alert" className="text-sm text-danger">{error}</p><Button type="button" variant="ghost" onClick={() => { setError(null); setAttempt((value) => value + 1); }}>Reintentar Google</Button></div>}
    </div>
  );
}
