import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGameStore } from "@/store/useGameStore";

export default function CharacterReveal() {
  const { character, isImpostor } = useGameStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!character) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-accent shadow-2xl">
              <img
                src={isImpostor ? "/impostor.webp" : character.imageUrl}
                alt={isImpostor ? "Impostor" : character.name}
                className="w-full h-full object-cover"
              />
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-3xl font-bold ${
                isImpostor ? "text-red-500" : "text-foreground"
              }`}
            >
              {isImpostor ? "Eres el Impostor" : character.name}
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
