import { useState } from "react";
import { useNavigate } from "react-router";
import { z } from "zod";
import { useUserStore } from "@/store/useUserStore";
import { ApiError } from "@/services/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, CheckCircle } from "lucide-react";
import BackgroundAnimate from "@/components/BackgroundAnimate";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { toast } from "sonner";

const usernamePattern = /^[a-zA-Z0-9_]+$/;

const signupSchema = z
  .object({
    username: z
      .string()
      .min(1, "Ingresa un nombre de usuario.")
      .max(30, "El nombre de usuario no puede superar 30 caracteres.")
      .regex(
        usernamePattern,
        "El nombre de usuario solo puede contener letras, números y guiones bajos (_). No uses espacios."
      ),
    email: z.email("Ingresa un email válido."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      error: "Debes aceptar los términos.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

type SignupFormData = Omit<z.input<typeof signupSchema>, "acceptedTerms"> & {
  acceptedTerms: boolean;
};
type SignupField = keyof SignupFormData;
type SignupErrors = Partial<Record<SignupField, string>>;

const signupFields: SignupField[] = [
  "username",
  "email",
  "password",
  "confirmPassword",
  "acceptedTerms",
];

function toSignupErrors(error: z.ZodError): SignupErrors {
  const fieldErrors = error.flatten().fieldErrors as Partial<
    Record<SignupField, string[] | undefined>
  >;

  return signupFields.reduce<SignupErrors>((errors, field) => {
    const message = fieldErrors[field]?.[0];
    if (message) errors[field] = message;
    return errors;
  }, {});
}

function humanizeFieldError(field: SignupField, message: string): string {
  const normalized = message.toLowerCase();
  const isTechnicalValidation =
    normalized.includes("invalid string") ||
    normalized.includes("must match pattern") ||
    normalized.includes("too small") ||
    normalized.includes("too big") ||
    normalized.includes("must contain") ||
    normalized.includes("required") ||
    normalized.includes("invalid_type") ||
    normalized.includes("invalid email") ||
    normalized.includes("expected ");

  if (field === "username") {
    if (
      normalized.includes("pattern") ||
      normalized.includes("whitespace") ||
      normalized.includes("space")
    ) {
      return "El nombre de usuario solo puede contener letras, números y guiones bajos (_). No uses espacios.";
    }
    if (normalized.includes("too small") || normalized.includes("minimum")) {
      return "Ingresa un nombre de usuario.";
    }
    if (normalized.includes("too big") || normalized.includes("maximum")) {
      return "El nombre de usuario no puede superar 30 caracteres.";
    }
  }

  if (field === "email" && isTechnicalValidation) {
    return "Ingresa un email válido.";
  }

  if (field === "password" && isTechnicalValidation) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (field === "confirmPassword" && isTechnicalValidation) {
    return "Las contraseñas no coinciden.";
  }

  if (field === "acceptedTerms") {
    return "Debes aceptar los términos para crear tu cuenta.";
  }

  return isTechnicalValidation
    ? "Revisa este campo e inténtalo nuevamente."
    : message;
}

function humanizeSignupError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No se pudo crear la cuenta. Inténtalo nuevamente.";
  }

  const message = error.message.toLowerCase();

  if (error.status === 0) {
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.";
  }

  if (message.includes("pattern") || message.includes("invalid string")) {
    return "El nombre de usuario solo puede contener letras, números y guiones bajos (_). No uses espacios.";
  }

  if (message.includes("invalid email")) {
    return "Ingresa un email válido.";
  }

  if (
    message.includes("too small") ||
    message.includes("too big") ||
    message.includes("must contain") ||
    message.includes("required") ||
    message.includes("invalid_type") ||
    message.includes("expected ")
  ) {
    return "Revisa los datos ingresados e inténtalo nuevamente.";
  }

  return error.message;
}

export default function SignupScreenV2() {
  const navigate = useNavigate();
  const signup = useUserStore((s) => s.signup);

  const [formData, setFormData] = useState<SignupFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as Exclude<SignupField, "acceptedTerms">;
    setFormData((current) => ({ ...current, [field]: e.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = signupSchema.safeParse(formData);

    if (!validation.success) {
      setErrors(toSignupErrors(validation.error));
      return;
    }

    const payload = {
      username: validation.data.username,
      email: validation.data.email,
      password: validation.data.password,
      confirmPassword: validation.data.confirmPassword,
    };

    setSubmitting(true);
    try {
      await signup(payload);
      navigate("/menu", { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const fieldErrors = Object.entries(error.fieldErrors).reduce<SignupErrors>(
          (current, [field, messages]) => {
            if (signupFields.includes(field as SignupField) && messages[0]) {
              current[field as SignupField] = humanizeFieldError(
                field as SignupField,
                messages[0]
              );
            }
            return current;
          },
          {}
        );
        setErrors(fieldErrors);
      }
      toast.error(humanizeSignupError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background text-foreground">
      <BackgroundAnimate />

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

      <div className="w-full max-w-6xl">
        <Card className="shadow-md border-none overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[700px] bg-card text-card-foreground">
          <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center p-6 animate-bounce-in">
            <div className="relative w-72 h-72">
              <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-accent/20 to-transparent -translate-x-1/2 -translate-y-1/2" />
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
              <form noValidate onSubmit={handleSubmit} className="space-y-4">
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
                      maxLength={30}
                      aria-invalid={Boolean(errors.username)}
                      aria-describedby={errors.username ? "username-error" : undefined}
                      className={`pl-10 placeholder:text-muted-foreground ${
                        errors.username ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p id="username-error" className="mt-1 text-sm text-red-400" role="alert">
                      {errors.username}
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
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      className={`pl-10 placeholder:text-muted-foreground ${
                        errors.email ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
                      {errors.email}
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
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      className={`pl-10 placeholder:text-muted-foreground ${
                        errors.password ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
                      {errors.password}
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
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={
                        errors.confirmPassword ? "confirm-password-error" : undefined
                      }
                      className={`pl-10 placeholder:text-muted-foreground ${
                        errors.confirmPassword ? "border-red-400" : ""
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p
                      id="confirm-password-error"
                      className="mt-1 text-sm text-red-400"
                      role="alert"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    id="terms"
                    className={`rounded text-primary ${
                      errors.acceptedTerms ? "ring-2 ring-red-400" : ""
                    }`}
                    checked={formData.acceptedTerms}
                    onChange={(e) => {
                      setFormData((current) => ({
                        ...current,
                        acceptedTerms: e.target.checked,
                      }));
                      setErrors((current) => ({ ...current, acceptedTerms: undefined }));
                    }}
                    aria-invalid={Boolean(errors.acceptedTerms)}
                    aria-describedby={errors.acceptedTerms ? "terms-error" : undefined}
                  />
                  <label htmlFor="terms">
                    Acepto los{" "}
                    <span className="underline cursor-pointer">
                      términos y condiciones
                    </span>
                  </label>
                </div>
                {errors.acceptedTerms && (
                  <p id="terms-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.acceptedTerms}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  disabled={submitting}
                  className="w-full font-semibold text-lg rounded-md bg-primary hover:bg-primary/90"
                >
                  {submitting ? "Registrando..." : "Registrarse"}
                </Button>
              </form>

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
}
