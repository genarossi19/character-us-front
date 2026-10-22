interface GoogleIdentity {
  initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; auto_select: boolean }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; locale: string; width: number }) => void;
  disableAutoSelect: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

let loading: Promise<GoogleIdentity> | null = null;
let initialized = false;
let credentialHandler: ((credential: string) => void) | null = null;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (loading) return loading;
  loading = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    const timer = window.setTimeout(fail, 15_000);
    function fail() {
      window.clearTimeout(timer);
      script.onload = script.onerror = null;
      script.remove();
      loading = null;
      reject(new Error("No se pudo cargar Google. Revisa tu conexión e inténtalo de nuevo."));
    }
    script.onerror = fail;
    script.onload = () => {
      const identity = window.google?.accounts.id;
      if (!identity) { fail(); return; }
      window.clearTimeout(timer);
      script.onload = script.onerror = null;
      resolve(identity);
    };
    document.head.appendChild(script);
  });
  return loading;
}

export function renderGoogleButton(identity: GoogleIdentity, element: HTMLElement, clientId: string, handler: (credential: string) => void, text: "continue_with" | "signup_with" = "continue_with"): () => void {
  credentialHandler = handler;
  if (!initialized) {
    identity.initialize({ client_id: clientId, auto_select: false, callback: ({ credential }) => {
      if (credential) credentialHandler?.(credential);
    } });
    initialized = true;
  }
  identity.renderButton(element, { theme: "outline", size: "large", text, locale: "es", width: Math.max(200, Math.min(400, element.clientWidth)) });
  return () => {
    if (credentialHandler === handler) credentialHandler = null;
    element.replaceChildren();
  };
}

export function disableGoogleAutoSelect(): void {
  if (typeof window !== "undefined") window.google?.accounts.id.disableAutoSelect();
}
