import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { isAuthTransitionActive, useAuthNavigation } from "@/hooks/useAuthNavigation";
import { z } from "zod";
import { useUserStore } from "@/store/useUserStore";
import { ApiError } from "@/services/api/client";
import { BackButton, FormActionButton } from "@/components/ui/form-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, CheckCircle, Eye, EyeOff, LoaderCircle, AlertCircle } from "lucide-react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import SignupIllustration from "@/components/SignupIllustration";

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
    email: z.email("Ingresa un correo electrónico válido."),
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
    return "Ingresa un correo electrónico válido.";
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
    return "Ingresa un correo electrónico válido.";
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
  const navigateAuth = useAuthNavigation();
  const reduced = useReducedMotion() || isAuthTransitionActive();
  const errorRef = useRef<HTMLDivElement>(null);
  const signup = useUserStore((s) => s.signup);
  const loginWithGoogle = useUserStore((s) => s.loginWithGoogle);
  const pending = useRef(false);

  const [formData, setFormData] = useState<SignupFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [visible, setVisible] = useState({ password: false, confirmPassword: false });

  useEffect(() => {
    if (authError && !submitting) errorRef.current?.focus();
  }, [authError, submitting]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const field = e.target.name as Exclude<SignupField, "acceptedTerms">;
    setFormData((current) => ({ ...current, [field]: e.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setAuthError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    setAuthError(null);
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

    pending.current = true;
    setAuthError(null);
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
      setAuthError(humanizeSignupError(error));
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    if (pending.current) return;
    pending.current = true;
    setAuthError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle(credential);
      navigate("/menu", { replace: true });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "No se pudo continuar con Google");
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  const fields: { name: Exclude<SignupField, "acceptedTerms">; label: string; icon: typeof User; type: string; placeholder: string; autoComplete: string; maxLength?: number }[] = [
    { name: "username", label: "Usuario", icon: User, type: "text", placeholder: "Jugador123", autoComplete: "username", maxLength: 30 },
    { name: "email", label: "Correo electrónico", icon: Mail, type: "email", placeholder: "tu@correo.com", autoComplete: "email" },
    { name: "password", label: "Contraseña", icon: Lock, type: "password", placeholder: "Tu contraseña", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirmar contraseña", icon: CheckCircle, type: "password", placeholder: "Repítela", autoComplete: "new-password" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-background page-gutter pb-10 pt-24 text-foreground lg:pb-6">
        <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between bg-background/95 page-gutter backdrop-blur-sm md:h-20">
          <BackButton onClick={() => navigate(-1)} />
          <ThemeToggleButton className="text-foreground hover:text-foreground" />
        </header>

        <main className="mx-auto flex w-full max-w-xl flex-1 items-center py-6 sm:max-w-2xl lg:max-w-6xl lg:py-0">
          <motion.div className="w-full" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="auth-frame relative gap-0 overflow-hidden border-accent/20 bg-card py-0 shadow-lg shadow-black/5">
              <div inert={submitting} aria-busy={submitting} className={`lg:grid lg:grid-cols-[1.15fr_0.85fr] ${submitting ? "invisible" : "visible"}`}>
                <div className="auth-visual relative overflow-hidden border-b border-border bg-accent/[0.035] px-6 py-5 sm:px-10 lg:order-2 lg:flex lg:flex-col lg:justify-between lg:border-b-0 lg:border-l lg:p-8 xl:p-10">
                  <div className="relative z-10 flex items-center gap-3">
                    <img src="/logo.webp" alt="" className="size-10 rounded-xl lg:size-12" />
                    <p className="text-2xl font-semibold tracking-tight lg:text-3xl">Character<span className="text-accent">Us</span></p>
                  </div>
                  <div className="relative z-10 mt-7 hidden lg:block">
                    <p className="text-4xl font-semibold leading-tight xl:text-5xl">Tu historia<br />empieza aquí<span className="text-accent">.</span></p>
                    <p className="mt-3 max-w-xs text-base text-muted-foreground">Tu nombre es el primer paso.</p>
                  </div>
                  <div className="signup-ticket-scene relative mt-4 hidden h-60 lg:block">
                    <SignupIllustration username={formData.username} />
                  </div>
                </div>

                <CardContent className="auth-form px-6 py-7 sm:px-10 sm:py-8 lg:flex lg:items-center lg:px-8 lg:py-6 xl:px-10">
                  <div className="mx-auto w-full max-w-[400px]">
                    <h1 tabIndex={-1} className="text-3xl font-semibold outline-none sm:text-4xl">Crear cuenta</h1>
                    <p className="mb-5 mt-2 text-base text-muted-foreground sm:text-lg">Tu lugar para reunir al grupo.</p>
                    <GoogleSignInButton mode="register" onCredential={handleGoogleCredential} disabled={submitting} />
                    <div className="my-4 flex items-center gap-3 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>o con tu correo</span><span className="h-px flex-1 bg-border" /></div>

                    {authError && <div ref={errorRef} id="signup-error" role="alert" tabIndex={-1} className="mb-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger outline-none focus-visible:ring-2 focus-visible:ring-danger"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>{authError}</p></div>}

                    <form noValidate onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2" aria-describedby={authError ? "signup-error" : undefined}>
                      {fields.map((field) => {
                        const secret = field.name === "password" || field.name === "confirmPassword" ? field.name : null;
                        return <div key={field.name} className="min-w-0">
                          <label htmlFor={field.name} className="mb-1 block text-base font-medium text-muted-foreground">{field.label}</label>
                          <div className="relative">
                            <field.icon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <Input id={field.name} name={field.name} type={secret && visible[secret] ? "text" : field.type} placeholder={field.placeholder} autoComplete={field.autoComplete} value={formData[field.name]} maxLength={field.maxLength} onChange={handleInputChange} aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${field.name}-error` : field.name === "password" ? "password-help" : undefined} className={`pl-10 placeholder:text-muted-foreground ${secret ? "pr-11" : ""} ${errors[field.name] ? "border-danger" : ""}`} />
                            {secret && <button type="button" aria-label={`${visible[secret] ? "Ocultar" : "Mostrar"} ${secret === "password" ? "contraseña" : "confirmación de contraseña"}`} aria-pressed={visible[secret]} aria-controls={field.name} onClick={() => setVisible((current) => ({ ...current, [secret]: !current[secret] }))} className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">{visible[secret] ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}</button>}
                          </div>
                          {errors[field.name] && <p id={`${field.name}-error`} role="alert" className="mt-1 text-sm text-danger">{errors[field.name]}</p>}
                        </div>;
                      })}
                      <p id="password-help" className="-mt-1 text-xs text-muted-foreground lg:col-span-2">Usa al menos 8 caracteres para tu contraseña.</p>
                      <div className="lg:col-span-2">
                        <label htmlFor="terms" className="flex cursor-pointer items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                          <input type="checkbox" id="terms" checked={formData.acceptedTerms} onChange={(event) => { setFormData((current) => ({ ...current, acceptedTerms: event.target.checked })); setErrors((current) => ({ ...current, acceptedTerms: undefined })); }} aria-invalid={Boolean(errors.acceptedTerms)} aria-describedby={errors.acceptedTerms ? "terms-error" : undefined} className="mt-0.5 size-4 shrink-0 rounded accent-accent focus-visible:outline-2 focus-visible:outline-ring" />
                          <span>Acepto los términos y condiciones.</span>
                        </label>
                        {errors.acceptedTerms && <p id="terms-error" role="alert" className="mt-1 text-sm text-danger">{errors.acceptedTerms}</p>}
                      </div>
                      <div className="lg:col-span-2"><FormActionButton tone="accent" type="submit" disabled={submitting}>Crear cuenta</FormActionButton></div>
                    </form>
                    <p className="mt-5 text-center text-base text-muted-foreground">¿Ya tienes cuenta? <button type="button" onClick={() => { void navigateAuth("/login"); }} className="rounded-sm font-semibold text-foreground underline decoration-accent underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-ring">Inicia sesión</button></p>
                  </div>
                </CardContent>
              </div>
              {submitting && <div role="status" aria-live="polite" className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-card px-8 text-center text-card-foreground">
                <div className="rounded-full bg-accent/15 p-5"><LoaderCircle className="size-10 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" /></div>
                <div><p className="text-2xl font-semibold">Preparando tu cuenta</p><p className="mt-2 text-base text-muted-foreground">Espera un momento…</p></div>
                <div role="progressbar" aria-label="Registro en curso" className="h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-muted"><div className="auth-loading-bar h-full w-1/2 rounded-full bg-accent" /></div>
              </div>}
            </Card>
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  );
}
