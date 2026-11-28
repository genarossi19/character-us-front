import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { isAuthTransitionActive, useAuthNavigation } from "@/hooks/useAuthNavigation";
import { useUserStore } from "@/store/useUserStore";
import { FormActionButton } from "@/components/ui/form-actions";
import { Card, CardContent } from "@/components/ui/card";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Mail, Lock, LoaderCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import { AccessHeader } from "@/components/AccessHeader";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginScreenV2() {
  const navigate = useNavigate();
  const navigateAuth = useAuthNavigation();
  const reduced = useReducedMotion() || isAuthTransitionActive();
  const errorRef = useRef<HTMLDivElement>(null);
  const login = useUserStore((s) => s.login);
  const loginWithGoogle = useUserStore((s) => s.loginWithGoogle);
  const submitting = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (authError && !isLoading) errorRef.current?.focus();
  }, [authError, isLoading]);

  const emailIsValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const emailInvalid =
    !emailIsValid(email) && (touched.email || email.length > 0);
  const passwordInvalid =
    password.length > 0 &&
    password.length < 6 &&
    (touched.password || password.length > 0);
  const formValid = emailIsValid(email) && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid || submitting.current) return;
    submitting.current = true;
    setAuthError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/menu");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "No se pudo iniciar sesión");
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    if (submitting.current) return;
    submitting.current = true;
    setAuthError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(credential);
      navigate("/menu");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google");
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-background page-gutter pb-10 pt-24 text-foreground lg:pb-6">
        <AccessHeader onBack={() => navigate(-1)} />

        <main className="mx-auto flex w-full max-w-xl flex-1 items-center py-6 sm:max-w-2xl lg:max-w-6xl lg:py-0">
          <motion.div className="w-full" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="auth-frame relative gap-0 overflow-hidden border-accent/20 bg-card py-0 shadow-lg shadow-black/5">
              <div inert={isLoading} aria-busy={isLoading} className={`lg:grid lg:grid-cols-[0.85fr_1.15fr] ${isLoading ? "invisible" : "visible"}`}>
                <div className="auth-visual relative overflow-hidden border-b border-border bg-accent/5 px-6 py-5 sm:px-10 lg:flex lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:p-8 xl:p-10">
                  <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo.webp" alt="" className="size-10 rounded-xl lg:size-12" />
                    <p className="text-2xl font-semibold tracking-tight lg:text-3xl">Character<span className="text-accent">Us</span></p>
                  </div>
                  <div className="relative z-10 mt-7 hidden lg:block">
                    <p className="text-4xl font-semibold leading-tight xl:text-5xl">Vuelve<br />al juego<span className="text-accent">.</span></p>
                    <p className="mt-3 text-base text-muted-foreground">Tu grupo pone el resto.</p>
                  </div>
                  <div className="login-illustration relative mt-3 hidden h-48 lg:block xl:h-56" aria-hidden="true">
                    <div className="absolute inset-x-5 bottom-2 h-28 rounded-[50%] bg-accent/10" />
                    <motion.img src="/avatar1.webp" alt="" className="absolute bottom-2 right-0 w-[48%] max-w-40 object-contain" initial={reduced ? false : { opacity: 0, rotate: 8, y: 8 }} animate={{ opacity: 1, rotate: 8, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} />
                    <motion.img src="/avatar7.webp" alt="" className="absolute bottom-0 left-0 w-[60%] max-w-52 object-contain" initial={reduced ? false : { opacity: 0, rotate: -8, y: 12 }} animate={{ opacity: 1, rotate: -8, y: 0 }} transition={{ duration: 0.4 }} />
                  </div>
                </div>

                <CardContent className="auth-form px-6 py-7 sm:px-10 sm:py-8 lg:flex lg:items-center lg:px-8 lg:py-6 xl:px-10">
                  <div className="mx-auto w-full max-w-[400px]">
                  <h1 tabIndex={-1} className="text-3xl font-semibold outline-none sm:text-4xl">Iniciar sesión</h1>
                  <p className="mb-5 mt-2 text-base text-muted-foreground sm:text-lg">Accede para empezar tu próxima partida.</p>

                  <GoogleSignInButton onCredential={handleGoogleCredential} disabled={isLoading} />
                  <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>o con tu correo</span><span className="h-px flex-1 bg-border" /></div>

                  {authError && (
                    <div ref={errorRef} id="login-error" role="alert" tabIndex={-1} className="mb-5 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger outline-none focus-visible:ring-2 focus-visible:ring-danger">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>{authError}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="grid gap-4" aria-describedby={authError ? "login-error" : undefined}>
                    <div>
                      <label htmlFor="email" className="mb-1 block text-base font-medium text-muted-foreground">Correo electrónico</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input id="email" name="email" type="email" autoComplete="username" placeholder="tu@correo.com" value={email}
                          onChange={(event) => { setEmail(event.target.value); setAuthError(null); }}
                          onBlur={() => setTouched((previous) => ({ ...previous, email: true }))}
                          aria-invalid={emailInvalid} aria-describedby={emailInvalid ? "email-error" : undefined}
                          className={`pl-10 placeholder:text-muted-foreground ${emailInvalid ? "border-danger" : ""}`} />
                      </div>
                      {emailInvalid && <p id="email-error" className="mt-2 text-sm text-danger">Ingresa un correo válido.</p>}
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-1 block text-base font-medium text-muted-foreground">Contraseña</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Tu contraseña" value={password}
                          onChange={(event) => { setPassword(event.target.value); setAuthError(null); }}
                          onBlur={() => setTouched((previous) => ({ ...previous, password: true }))}
                          aria-invalid={passwordInvalid} aria-describedby={passwordInvalid ? "password-error" : undefined}
                          className={`pl-10 pr-12 placeholder:text-muted-foreground ${passwordInvalid ? "border-danger" : ""}`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} aria-controls="password" className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                          {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                        </button>
                      </div>
                      {passwordInvalid && <p id="password-error" className="mt-2 text-sm text-danger">La contraseña debe tener al menos 6 caracteres.</p>}
                    </div>

                    <div><FormActionButton tone="accent" type="submit" disabled={!formValid || isLoading}>Iniciar sesión</FormActionButton></div>
                  </form>

                  <p className="mt-5 text-center text-base text-muted-foreground">¿No tienes cuenta? <button type="button" onClick={() => { void navigateAuth("/signup"); }} className="rounded-sm font-semibold text-foreground underline decoration-accent underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-ring">Regístrate</button></p>
                  </div>
                </CardContent>
              </div>

              {isLoading && (
                <div role="status" aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-card px-8 text-center text-card-foreground">
                  <div className="rounded-full bg-accent/15 p-5"><LoaderCircle aria-hidden="true" className="size-10 animate-spin text-accent motion-reduce:animate-none" /></div>
                  <div><p className="text-2xl font-semibold">Iniciando sesión</p><p className="mt-2 text-base text-muted-foreground">Estamos verificando tus datos…</p></div>
                  <div role="progressbar" aria-label="Inicio de sesión en curso" className="h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-muted"><div className="auth-loading-bar h-full w-1/2 rounded-full bg-accent" /></div>
                </div>
              )}
            </Card>
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  );
}
