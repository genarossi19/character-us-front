import { useRef, useState, type KeyboardEventHandler } from "react";
import { motion, useReducedMotion } from "motion/react";

type RoomCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  invalid?: boolean;
  disabled?: boolean;
};

// Keep a single accessible input; this code is entered and erased sequentially.
export default function RoomCodeInput({ value, onChange, onKeyDown, invalid, disabled }: RoomCodeInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const moveToEnd = () => {
    const element = input.current;
    if (element && (element.selectionStart !== element.value.length || element.selectionEnd !== element.value.length)) {
      element.setSelectionRange(element.value.length, element.value.length);
    }
  };

  return (
    <div className="relative" onPointerDown={(event) => {
      if (disabled) return;
      event.preventDefault();
      input.current?.focus();
      moveToEnd();
    }}>
      <input
        ref={input}
        id="roomCode"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        maxLength={6}
        value={value}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "join-error" : undefined}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        onPaste={(event) => {
          event.preventDefault();
          const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
          if (!digits) return;
          onChange((value + digits).slice(0, 6));
          requestAnimationFrame(moveToEnd);
        }}
        onKeyDown={(event) => {
          if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            onChange(value.slice(0, -1));
            return;
          }
          moveToEnd();
          onKeyDown(event);
        }}
        onFocus={() => { setFocused(true); moveToEnd(); }}
        onBlur={() => setFocused(false)}
        onSelect={moveToEnd}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
      />
      <div aria-hidden="true" className={`grid grid-cols-6 gap-1.5 sm:gap-3 ${disabled ? "opacity-50" : ""}`}>
        {Array.from({ length: 6 }, (_, index) => {
          const digit = value[index];
          const active = focused && Math.min(value.length, 5) === index;
          return (
            <div key={index} className={`flex h-14 min-w-0 items-center justify-center rounded-md border-2 bg-muted/30 text-2xl font-semibold text-foreground transition-colors duration-100 sm:h-20 sm:text-4xl ${invalid ? "border-danger" : active ? "border-accent ring-2 ring-accent/20" : "border-border"}`}>
              {digit ? <motion.span key={digit} initial={reduced ? false : { opacity: 0, y: 5, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.12, ease: "easeOut" }}>{digit}</motion.span>
                : active ? <span className="h-6 w-0.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none sm:h-8" /> : <span className="text-muted-foreground/40">·</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
