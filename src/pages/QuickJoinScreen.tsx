import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import BackgroundAnimate from "../components/BackgroundAnimate";
import { useNavigate } from "react-router";
interface QuickJoinScreenProps {
  onBack: () => void;
}

const QuickJoinScreen: React.FC<QuickJoinScreenProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");

  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(false);
    if (roomCode.length >= 6) {
      setIsValid(true);
    }
  }, [roomCode]);

  const onJoin = () => {
    if (roomCode === "123456") {
      navigate("/lobby");
    } else {
      alert("Sala no encontrada");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onJoin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Button
        onClick={onBack}
        size={"lg"}
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:bg-white/10 text-xl"
      >
        ← Volver
      </Button>
      <Button
        size={"lg"}
        onClick={() => navigate("/login")}
        variant="ghost"
        className="absolute top-4 right-4 text-white hover:bg-white/10 text-xl"
      >
        Log In
      </Button>

      <BackgroundAnimate />
      <Card className="border-none bg-white min-w-[300px] w-md animate-bounce-in">
        <CardHeader>
          <CardTitle className="flex flex-col text-center justify-center items-center gap-4">
            <img
              src="/logo.webp"
              alt="logo"
              className=" w-24 h-24 rounded-md"
            />
            <span className=" text-3xl font-fredoka font-bolds">
              Ingresar a una Sala
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Codigo de Sala"
              className="text-center !text-gray-600 !text-3xl border-2 !tracking-widest placeholder:tracking-normal !font-bold placeholder:font-normal border-gray-400 h-12 w-full  placeholder:text-2xl placeholder:text-center placeholder:text-gray-400 "
            />
            <Button
              disabled={!isValid}
              variant={"secondary"}
              className="h-12 "
              onClick={handleSubmit}
            >
              <span className="text-xl">Ingresar</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickJoinScreen;
