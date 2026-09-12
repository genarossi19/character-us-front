import { useNavigate } from "react-router";
import { useUserStore } from "@/store/useUserStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/ui/shadcn-io/theme-toggle-button";
import { ArrowLeft, User, Mail, Shield, Gamepad2 } from "lucide-react";

const avatars = [
  "/avatar1.webp",
  "/avatar2.webp",
  "/avatar3.webp",
  "/avatar4.webp",
  "/avatar5.webp",
  "/avatar6.webp",
  "/avatar7.webp",
  "/avatar8.webp",
];

export default function ProfileV2() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useUserStore();

  const handleAvatarChange = (avatar: string) => {
    if (!user) return;
    setUser({ ...user, avatarUrl: avatar });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-6 flex items-center justify-between bg-card shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            size="lg"
            className="text-foreground hover:bg-accent/20"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggleButton />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6 pt-24">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Mi Perfil</h1>
            <p className="text-muted-foreground">
              Gestiona tu cuenta y personaliza tu avatar
            </p>
          </div>

          <Card className="shadow-lg border-none">
            <CardContent className="p-8 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full border-4 border-accent shadow-lg"
                  />
                  {user.isGuest && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      Invitado
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">
                    {user.username}
                  </h2>
                  {user.email && (
                    <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium text-foreground">
                      {user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium text-foreground">
                      {user.isGuest ? "Invitado" : "Registrado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-medium text-foreground font-mono text-sm">
                      {user.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Avatar selection */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Cambiar avatar
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => handleAvatarChange(avatar)}
                      className={`relative rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                        user.avatarUrl === avatar
                          ? "border-accent shadow-lg scale-110"
                          : "border-transparent hover:border-accent/50"
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${avatar}`}
                        className="w-full h-full object-cover aspect-square"
                      />
                      {user.avatarUrl === avatar && (
                        <div className="absolute inset-0 bg-accent/20" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                {!user.isGuest && (
                  <Button
                    onClick={() => navigate("/menu")}
                    className="w-full bg-gradient-to-br from-accent to-secondary hover:from-secondary hover:to-accent"
                  >
                    Ir al Menú
                  </Button>
                )}

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full"
                >
                  Cerrar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
