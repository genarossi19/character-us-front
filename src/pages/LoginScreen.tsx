import type React from "react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
interface LoginScreenProps {
  onLogin: () => void;
  onQuickJoin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onQuickJoin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center space-y-2 animate-bounce-in">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
            🎭
          </div>
          <h1 className="text-4xl font-bold text-white text-balance">
            CharacterUs
          </h1>
          <p className="text-white/80 text-pretty text-lg">
            Descubre quién es el impostor en este emocionante juego social
          </p>
        </div>

        <div className="space-y-4">
          <Card className="border-white/20 bg-white/10 backdrop-blur-md">
            <CardContent className="p-6 space-y-4">
              <Button
                onClick={onQuickJoin}
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 text-lg rounded-2xl animate-pulse-glow"
              >
                🚀 Unirse Rápido con Código
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/10 px-3 py-1 rounded-full text-white/70">
                    O
                  </span>
                </div>
              </div>

              <Button
                onClick={onLogin}
                variant="outline"
                className="w-full border-white/30 hover:bg-white/10 bg-transparent text-white font-medium py-4 text-lg rounded-2xl"
              >
                📧 Iniciar Sesión / Registrarse
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* </CHANGE> */}
      </div>
    </div>
  );
};

export default LoginScreen;
