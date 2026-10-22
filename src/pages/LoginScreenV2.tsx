import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import BackgroundAnimate from "@/components/BackgroundAnimate";
import { Input } from "@/components/ui/input";
import { Mail, Lock } from "lucide-react";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginScreenV2() {
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
  const loginWithGoogle = useUserStore((s) => s.loginWithGoogle);
  const submitting = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/menu");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión");
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    if (submitting.current) return;
    submitting.current = true;
    setIsLoading(true);
    try {
      await loginWithGoogle(credential);
      navigate("/menu");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google");
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            onClick={() => navigate(-1)}
            size="lg"
            variant="ghost"
            className="text-light hover:bg-accent/20 text-lg font-semibold transition-colors"
          >
            ← Volver
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton className="text-light" />
        </div>
      </header>

      <BackgroundAnimate />

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2 animate-bounce-in">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center shadow-2xl">
            <img className="rounded-xl" src="/logo.webp" alt="logo" />
          </div>
          <h1 className="text-4xl font-bold text-white">CharacterUs</h1>
        </div>

        <Card className="backdrop-blur-md shadow-md animate-bounce-in animate-pulse-glow border-none">
          <CardTitle>
            <h1 className="text-center text-4xl font-extrabold">
              Iniciar sesión
            </h1>
          </CardTitle>
          <CardContent className="pt-6">
            <GoogleSignInButton onCredential={handleGoogleCredential} disabled={isLoading} />
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />o continúa con tu email<div className="h-px flex-1 bg-border" /></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-md font-medium text-gray-600 dark:text-light"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched({ ...touched, email: true })}
                    aria-invalid={emailInvalid}
                    className={
                      "pl-10 placeholder:text-gray-400 " +
                      (emailInvalid ? "border-red-400" : "")
                    }
                  />
                </div>
                {emailInvalid && (
                  <p className="mt-1 text-sm text-red-400">
                    Por favor ingresa un email válido.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-md font-medium text-gray-600 dark:text-light"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched({ ...touched, password: true })}
                    aria-invalid={passwordInvalid}
                    className={
                      "pl-10 placeholder:text-gray-400 " +
                      (passwordInvalid ? "border-red-400" : "")
                    }
                  />
                </div>
                {passwordInvalid && (
                  <p className="mt-1 text-sm text-red-400">
                    La contraseña debe tener al menos 6 caracteres.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                disabled={!formValid || isLoading}
                className="w-full text-white font-semibold text-lg rounded-md"
              >
                {isLoading ? "Iniciando..." : "Entrar"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              ¿No tienes cuenta?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-accent font-semibold cursor-pointer"
              >
                Regístrate
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
