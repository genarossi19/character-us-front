import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/store/useGameStore";
import { ShieldAlert } from "lucide-react";

export default function CharacterReveal() {
  const { character, isImpostor } = useGameStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!isImpostor && !character) return null;

  return (
    <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-2xl border border-border bg-card px-5 py-10">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Tu identidad · solo tú puedes verla</p>
            <div className={`flex size-48 items-center justify-center overflow-hidden rounded-3xl border-2 shadow-xl sm:size-64 ${isImpostor ? "border-impostor/40 bg-impostor/10" : "border-accent/40"}`}>
              {isImpostor ? <ShieldAlert className="size-28 text-impostor" aria-hidden="true" /> : <img
                src={character?.imageUrl || "/logo.webp"}
                alt={character?.name || "Personaje"}
                className="size-full object-cover"
              />}
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-3xl font-bold ${
                isImpostor ? "text-impostor" : "text-foreground"
              }`}
            >
              {isImpostor ? "Eres el Impostor" : character?.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-muted-foreground text-center max-w-md"
            >
              {isImpostor
                ? "Evita ser descubierto. No conoces el personaje, así que ten cuidado con las pistas."
                : "Prepárate para dar pistas sobre tu personaje sin revelarlo demasiado."}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
