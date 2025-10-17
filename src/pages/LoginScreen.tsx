import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import BackgroundAnimate from "../components/BackgroundAnimate";
import { Input } from "../components/ui/input";
import { Mail, Lock, Chrome, Github } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";
import { ThemeToggleButton } from "../components/ui/shadcn-io/theme-toggle-button";

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // prevención adicional: no submit si campos incompletos o contraseña corta
    if (!formData.email.trim() || formData.password.length < 8) return;

    // login aquí
    navigate("/menu");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const emailIsValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const emailInvalid =
    !emailIsValid(formData.email) &&
    (touched.email || formData.email.length > 0);
  const passwordInvalid =
    formData.password.length > 0 &&
    formData.password.length < 8 &&
    (touched.password || formData.password.length > 0);

  const loginValid = formData.email.trim() && formData.password.length >= 8;

  const getLoginDisabledReasons = () => {
    const reasons: string[] = [];
    if (!formData.email.trim()) reasons.push("Falta el email.");
    if (formData.password.length < 8)
      reasons.push("La contraseña debe tener al menos 8 caracteres.");
    return reasons;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between  ">
        {/* Botón Volver */}
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

        {/* Sección derecha */}
        <div className="flex items-center gap-2">
          <ThemeToggleButton className="text-light" />
        </div>
      </header>

      <BackgroundAnimate />

      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-md font-medium text-gray-600 dark:text-light"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 " />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={formData.email}
                    onChange={handleInputChange}
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

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-md font-medium text-gray-600 dark:text-light"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 " />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="********"
                    value={formData.password}
                    onChange={handleInputChange}
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
                    La contraseña debe tener al menos 8 caracteres.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="rounded" />
                  <label htmlFor="remember" className="text-gray-500">
                    Recordarme
                  </label>
                </div>
                <button
                  type="button"
                  className="text-accent font-semibold hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="w-full">
                      <Button
                        type="submit"
                        variant="default"
                        size="lg"
                        disabled={!loginValid}
                        className="w-full text-white font-semibold text-lg rounded-md "
                      >
                        Entrar
                      </Button>
                    </div>
                  </PopoverTrigger>
                  {!loginValid && (
                    <PopoverContent>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {getLoginDisabledReasons().map((r) => (
                          <div key={r}>{r}</div>
                        ))}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-600" />
              <span className="mx-2 text-gray-400 text-sm">o</span>
              <div className="flex-grow border-t border-gray-600" />
            </div>

            {/* Social signup */}
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full flex-1 flex items-center gap-2 justify-center"
              >
                <Chrome className="h-5 w-5" /> Google
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full flex-1 flex items-center gap-2 justify-center"
              >
                <Github className="h-5 w-5" /> GitHub
              </Button>
            </div>

            {/* Redirect signup */}
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
};

export default LoginScreen;
