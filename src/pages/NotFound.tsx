import React from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-red-700 dark:from-red-950 dark:to-red-800 p-4 transition-colors">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center bg-red-50 dark:bg-red-900/90 rounded-2xl shadow-2xl overflow-hidden transition-colors backdrop-blur-sm">
        <div className="md:w-1/2 w-full flex justify-center items-center bg-red-100 dark:bg-red-950/70 p-6 transition-colors backdrop-blur-sm">
          <img
            src="/impostor.webp"
            alt="Impostor"
            className="w-64 h-64 object-contain filter drop-shadow-[0_0_10px_rgba(255,0,0,0.7)] transition-all"
          />
        </div>

        <div className="md:w-1/2 w-full p-8 flex flex-col items-center text-center md:text-left">
          <h1 className="text-6xl font-extrabold text-red-800 dark:text-red-500 mb-4 transition-colors">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-200 mb-4 transition-colors">
            Página no encontrada
          </h2>
          <p className="text-red-600 dark:text-red-300 mb-6 transition-colors">
            Lo sentimos, la página que estás buscando no existe o ha sido
            eliminada.
          </p>

          <Button
            variant="default"
            size="lg"
            onClick={() => navigate("/")}
            className="bg-red-700 dark:bg-red-600/90 text-white hover:bg-red-800 dark:hover:bg-red-500 transition-colors shadow-md dark:shadow-red-900/50"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
