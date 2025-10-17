import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Mail, Lock, User, CheckCircle, Github, Chrome } from "lucide-react";
import BackgroundAnimate from "../components/BackgroundAnimate";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";
import { ThemeToggleButton } from "../components/ui/shadcn-io/theme-toggle-button";

const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [touchedTerms, setTouchedTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    navigate("/menu");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const emailIsValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const usernameInvalid =
    !formData.username.trim() &&
    (touched.username || formData.username.length > 0);
  const emailInvalid =
    !emailIsValid(formData.email) &&
    (touched.email || formData.email.length > 0);
  const passwordInvalid =
    formData.password.length > 0 &&
    formData.password.length < 8 &&
    (touched.password || formData.password.length > 0);
  const confirmInvalid =
    formData.confirmPassword.length > 0 &&
    formData.confirmPassword !== formData.password &&
    (touched.confirmPassword || formData.confirmPassword.length > 0);
  const termsInvalid = !acceptedTerms && touchedTerms;

  const isFormValid = () =>
    formData.username.trim().length > 0 &&
    emailIsValid(formData.email) &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    acceptedTerms;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background text-foreground">
      <BackgroundAnimate />

      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between  ">
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

      <div className="w-full max-w-6xl">
        <Card className="shadow-md border-none overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[700px] bg-card text-card-foreground">
          <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center p-6 animate-bounce-in">
            <div className="relative w-72 h-72">
              <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-accent/20 to-transparent -translate-x-1/2 -translate-y-1/2"></div>
              <img
                src="/avatar3.webp"
                alt="Character"
                className="w-full h-full object-contain relative z-10"
              />
            </div>

            <h2 className="mt-8 text-4xl font-extrabold text-center text-foreground z-10">
              CharacterUs
            </h2>
            <p className="mt-2 text-foreground/80 text-center text-lg z-10 px-4">
              Únete a partidas online, crea tu cuenta y empieza a jugar con tu
              personaje favorito.
            </p>
          </div>

          {/*  Form */}
          <div className="md:w-1/2 flex flex-col justify-center p-6 md:p-10 min-h-screen md:min-h-[700px] bg-card rounded-tr-lg rounded-br-lg">
            <div className="md:hidden mb-4 flex justify-center">
              <img
                src="/logo.webp"
                alt="Logo"
                className="w-24 h-24 object-contain rounded-md"
              />
            </div>

            <h3 className="text-xl md:text-2xl font-semibold text-center text-foreground mb-2">
              Sign Up
            </h3>
            <CardTitle>
              <h1 className="text-3xl md:text-4xl font-extrabold text-center text-foreground mb-4">
                Crear cuenta
              </h1>
            </CardTitle>

            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-md font-medium text-muted-foreground"
                  >
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      placeholder="Jugador123"
                      value={formData.username}
                      onChange={handleInputChange}
                      onBlur={() => setTouched({ ...touched, username: true })}
                      aria-invalid={usernameInvalid}
                      className={`pl-10 placeholder:text-muted-foreground ${
                        usernameInvalid ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {usernameInvalid && (
                    <p className="mt-1 text-sm text-red-400">
                      Ingresa un nombre de usuario.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-md font-medium text-muted-foreground"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jugador@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={() => setTouched({ ...touched, email: true })}
                      aria-invalid={emailInvalid}
                      className={`pl-10 placeholder:text-muted-foreground ${
                        emailInvalid ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {emailInvalid && (
                    <p className="mt-1 text-sm text-red-400">
                      Ingresa un email válido.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-md font-medium text-muted-foreground"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="********"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => setTouched({ ...touched, password: true })}
                      aria-invalid={passwordInvalid}
                      className={`pl-10 placeholder:text-muted-foreground ${
                        passwordInvalid ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {passwordInvalid && (
                    <p className="mt-1 text-sm text-red-400">
                      La contraseña debe tener al menos 8 caracteres.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-md font-medium text-muted-foreground"
                  >
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="********"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={() =>
                        setTouched({ ...touched, confirmPassword: true })
                      }
                      aria-invalid={confirmInvalid}
                      className={`pl-10 placeholder:text-muted-foreground ${
                        confirmInvalid ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {confirmInvalid && (
                    <p className="mt-1 text-sm text-red-400">
                      Las contraseñas no coinciden.
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    id="terms"
                    className={`rounded text-primary ${
                      termsInvalid ? "ring-2 ring-red-400" : ""
                    }`}
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      setTouchedTerms(true);
                    }}
                  />
                  <label htmlFor="terms">
                    Acepto los{" "}
                    <span className="underline cursor-pointer">
                      términos y condiciones
                    </span>
                  </label>
                </div>
                {termsInvalid && (
                  <p className="mt-1 text-sm text-red-400">
                    Debes aceptar los términos.
                  </p>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <div className="w-full">
                      <Button
                        type="submit"
                        variant="default"
                        size="lg"
                        disabled={!isFormValid()}
                        className="w-full font-semibold text-lg rounded-md bg-primary hover:bg-primary/90"
                      >
                        Registrarse
                      </Button>
                    </div>
                  </PopoverTrigger>
                  {!isFormValid() && (
                    <PopoverContent>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {!formData.username.trim() && (
                          <div>Falta un nombre de usuario.</div>
                        )}
                        {!emailIsValid(formData.email) && formData.email && (
                          <div>Email inválido.</div>
                        )}
                        {!formData.email && <div>Falta el email.</div>}
                        {formData.password.length > 0 &&
                          formData.password.length < 8 && (
                            <div>
                              La contraseña debe tener al menos 8 caracteres.
                            </div>
                          )}
                        {formData.password !== formData.confirmPassword && (
                          <div>Las contraseñas no coinciden.</div>
                        )}
                        {!acceptedTerms && (
                          <div>Debes aceptar los términos.</div>
                        )}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              </form>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-muted" />
                <span className="mx-2 text-muted-foreground text-sm">o</span>
                <div className="flex-grow border-t border-muted" />
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full flex-1 flex items-center gap-2 justify-center text-foreground border-border"
                >
                  <Chrome className="h-5 w-5" /> Google
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full flex-1 flex items-center gap-2 justify-center text-foreground border-border"
                >
                  <Github className="h-5 w-5" /> GitHub
                </Button>
              </div>

              <p className="mt-6 text-center text-sm text-foreground">
                ¿Ya tienes cuenta?{" "}
                <span
                  onClick={() => navigate("/login")}
                  className="text-accent font-semibold cursor-pointer"
                >
                  Inicia sesión
                </span>
              </p>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignupScreen;
