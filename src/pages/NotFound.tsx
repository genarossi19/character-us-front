import React from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-red-700 p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center bg-red-50 rounded-2xl shadow-lg overflow-hidden">
        {/* Left: Image */}
        <div className="md:w-1/2 w-full flex justify-center items-center bg-red-100 p-6">
          <img
            src="/impostor.webp"
            alt="Impostor"
            className="w-64 h-64 object-contain"
          />
        </div>

        {/* Right: Text */}
        <div className="md:w-1/2 w-full p-8 flex flex-col items-center text-center md:text-left">
          <h1 className="text-6xl font-extrabold text-red-800 mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-red-700 mb-4">
            Página no encontrada
          </h2>
          <p className="text-red-600 mb-6">
            Lo sentimos, la página que estás buscando no existe o ha sido
            eliminada.
          </p>

          <Button
            variant="default"
            size="lg"
            onClick={() => navigate("/")}
            className="bg-red-700 text-white hover:bg-red-800"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
