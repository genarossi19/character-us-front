import { motion, useReducedMotion } from "motion/react";
import { isAuthTransitionActive } from "@/hooks/useAuthNavigation";

// A local preview of a seat at the game table, never actual room/role state.
export default function SignupIllustration({ username }: { username: string }) {
  const reduced = useReducedMotion() || isAuthTransitionActive();
  const name = username.trim() || "Tu nombre aquí";
  const characters = Array.from(name);
  const displayName = characters.length > 15 ? `${characters.slice(0, 14).join("")}…` : name;

  return (
    <svg viewBox="0 0 420 280" className="h-full w-full overflow-visible" aria-hidden="true">
      <ellipse cx="210" cy="143" rx="168" ry="79" fill="var(--accent)" fillOpacity="0.12" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1.5" />
      <ellipse cx="210" cy="139" rx="143" ry="59" fill="none" stroke="var(--accent)" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 7" />
      {/* Other seats around the table. */}
      {[{ x: 112, y: 60, color: "var(--warning)" }, { x: 303, y: 61, color: "var(--accent)" }, { x: 46, y: 149, color: "var(--secondary)" }].map((seat) => (
        <g key={seat.x} transform={`translate(${seat.x} ${seat.y})`}>
          <circle r="29" fill="var(--card)" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="1.5" />
          <circle r="23" fill={seat.color} fillOpacity="0.18" />
          <circle cy="-6" r="7" fill={seat.color} />
          <path d="M-13 15v-3a13 13 0 0 1 26 0v3" fill={seat.color} />
        </g>
      ))}
      {/* A face-down character card: the secret at the center of the game. */}
      <g transform="rotate(9 212 126)">
        <rect x="173" y="79" width="80" height="98" rx="10" fill="var(--card)" stroke="var(--accent)" strokeOpacity="0.4" />
      </g>
      <g transform="rotate(-8 206 120)">
        <rect x="162" y="68" width="82" height="102" rx="10" fill="var(--accent)" />
        <rect x="169" y="75" width="68" height="88" rx="6" fill="none" stroke="#fff" strokeOpacity="0.45" strokeDasharray="3 4" />
        <text x="203" y="94" textAnchor="middle" fill="#fff" fontSize="8" letterSpacing="1.1" fontWeight="600">EL PERSONAJE</text>
        <text x="203" y="139" textAnchor="middle" fill="#fff" fontSize="45" fontWeight="600">?</text>
      </g>
      <path d="m299 103 24 8-9 16" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M319 112c-3 24-18 43-38 52" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 6" />
      <motion.g initial={reduced ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}>
        <ellipse cx="211" cy="262" rx="135" ry="9" fill="var(--accent)" fillOpacity="0.08" />
        <path d="M210 179v17" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 4" />
        <rect x="66" y="195" width="288" height="64" rx="12" fill="var(--card)" stroke="var(--accent)" strokeWidth="2" />
        <image href="/logo.webp" x="80" y="204" width="46" height="46" />
        <text x="141" y="217" fill="var(--muted-foreground)" fontSize="10" letterSpacing="1.1">TU LUGAR EN LA PARTIDA</text>
        <text x="141" y="242" fill="var(--foreground)" fontSize="21" fontWeight="600">{displayName}</text>
        <circle cx="340" cy="198" r="10" fill="var(--accent)" />
        <path d="m335 198 3 3 6-7" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </svg>
  );
}
