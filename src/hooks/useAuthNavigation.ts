import { flushSync } from "react-dom";
import { useNavigate } from "react-router";

type AuthPath = "/login" | "/signup";
let switching = false;

export function isAuthTransitionActive(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-auth-transition");
}

function focusHeading(path: AuthPath) {
  if (window.location.pathname === path) {
    document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
  }
}

export function useAuthNavigation() {
  const navigate = useNavigate();

  return async (path: AuthPath) => {
    if (switching) return;
    const supported = typeof document.startViewTransition === "function";
    const animate = supported && window.matchMedia("(min-width: 1024px)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animate) {
      navigate(path);
      window.scrollTo({ top: 0, behavior: "instant" });
      requestAnimationFrame(() => focusHeading(path));
      return;
    }

    switching = true;
    const root = document.documentElement;
    root.dataset.authTransition = path === "/signup" ? "to-signup" : "to-login";
    let navigated = false;
    try {
      const transition = document.startViewTransition(async () => {
        // BrowserRouter must commit before the browser captures the new panels.
        flushSync(() => navigate(path));
        navigated = true;
        window.scrollTo({ top: 0, behavior: "instant" });
        // Give the already-loaded Google SDK and React effects one frame to settle.
        await new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, 100);
          requestAnimationFrame(() => { window.clearTimeout(timer); resolve(); });
        });
      });
      // Unsupported snapshot conditions can skip the animation, not navigation.
      void transition.ready.catch(() => {});
      await transition.finished;
    } catch {
      if (!navigated) navigate(path);
    } finally {
      delete root.dataset.authTransition;
      switching = false;
      focusHeading(path);
    }
  };
}
