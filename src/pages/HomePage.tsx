import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { MotionConfig, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ArrowDown, ArrowRight, Check, Eye, Fingerprint, MessageCircle, Sparkles, Swords, Users, Vote } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import NavMenu from "@/components/NavBar";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Users, title: "Reúne al grupo", text: "Alguien crea la sala y comparte el código. Los demás pueden unirse como invitados.", note: "Una sala. Todo tu grupo." },
  { icon: Eye, title: "Guarda el secreto", text: "Los inocentes ven el mismo personaje. El impostor tendrá que improvisar sin conocerlo.", note: "Mira tu pantalla con cuidado." },
  { icon: MessageCircle, title: "Da una pista", text: "Por turnos, di una palabra relacionada. Sé claro para tu equipo… pero no demasiado.", note: "Cada palabra te puede delatar." },
  { icon: Vote, title: "Debate y vota", text: "Compara las pistas, defiende tu versión y vota a quien te resulte sospechoso.", note: "¿Confías en tu intuición?" },
];

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.55 }}>{children}</motion.div>;
}

export default function HomePage() {
  const isLoggedIn = useUserStore(state => state.isLoggedIn);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const moving = !reduced;

  return (
    <MotionConfig reducedMotion="user">
      <div className="home-page min-h-screen bg-background text-foreground">
        <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-accent" style={{ scaleX: reduced ? scrollYProgress : progress }} />
        <NavMenu />
        <main>
          <section className="page-container home-section home-hero" aria-labelledby="home-title">
            <Reveal className="min-w-0">
              <p className="home-eyebrow"><Sparkles className="size-4" aria-hidden="true" />Amigos, personajes y un poquito de caos</p>
              <h1 id="home-title" className="home-title">Alguien aquí<br />está <span className="home-highlight">mintiendo.</span></h1>
              <p className="home-lead">Todos conocen al personaje. Menos uno.<br className="hidden sm:block" /> Da tu pista, escucha las demás y descubre al impostor entre tus amigos.</p>
              <div className="home-actions">
                <Button asChild className="home-button"><Link to={isLoggedIn ? "/menu" : "/signup"}>{isLoggedIn ? "Ir al menú" : "Crear mi cuenta"}<ArrowRight aria-hidden="true" /></Link></Button>
                <Button asChild variant="outline" className="home-button"><Link to="/join">Tengo un código</Link></Button>
              </div>
              {!isLoggedIn && <p className="mt-5 text-sm text-muted-foreground">Para crear una sala necesitas una cuenta. Para unirte, solo el código.</p>}
              <a href="#como-jugar" className="mt-8 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">Así se juega<ArrowDown className="size-4" aria-hidden="true" /></a>
            </Reveal>

            <div className="home-cast" aria-label="Tres personajes: uno de ellos esconde un secreto">
              <div className="home-orbit" aria-hidden="true" />
              <div className="home-orbit home-orbit-inner" aria-hidden="true" />
              <span className="home-sticker home-sticker-top"><Eye className="size-4" aria-hidden="true" />Yo sé quién es.</span>
              {[{ image: 7, className: "home-avatar-left", rotate: -12, delay: 0 }, { image: 1, className: "home-avatar-center", rotate: 4, delay: 0.5 }, { image: 8, className: "home-avatar-right", rotate: 12, delay: 1 }].map((avatar) => (
                <motion.img key={avatar.image} src={`/avatar${avatar.image}.webp`} alt="" className={`home-avatar ${avatar.className}`} animate={moving ? { y: [0, -16, 0], rotate: [avatar.rotate, avatar.rotate + 4, avatar.rotate] } : { y: 0, rotate: avatar.rotate }} transition={moving ? { duration: 4, repeat: Infinity, delay: avatar.delay, ease: "easeInOut" } : { duration: 0 }} />
              ))}
              <span className="home-sticker home-sticker-bottom"><Fingerprint className="size-5" aria-hidden="true" />¿Quién no está diciendo toda la verdad?</span>
              <span className="home-cast-star" aria-hidden="true">✦</span>
            </div>
          </section>

          <div className="home-ribbon" aria-hidden="true"><div className="page-container flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-sm font-semibold sm:text-base"><span>UNA PALABRA</span><span>✦</span><span>MIL SOSPECHAS</span><span>✦</span><span>CERO CARAS DE PÓKER</span></div></div>

          <section id="como-jugar" className="page-container home-section scroll-mt-8" aria-labelledby="how-title">
            <Reveal className="home-section-heading"><p className="home-eyebrow">01 / Las reglas caben en una ronda</p><h2 id="how-title" className="home-heading">Fácil de entender.<br /><span className="text-accent">Difícil de disimular.</span></h2><p className="home-lead">No necesitas saber actuar. Aunque, si eres el impostor, te va a venir bien.</p></Reveal>
            <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => <li key={step.title} className="min-w-0"><Reveal className="home-step h-full"><div className="flex items-center justify-between"><step.icon className="size-8 text-accent" aria-hidden="true" /><span className="text-4xl font-semibold text-muted-foreground/35">0{index + 1}</span></div><h3 className="mt-8 text-2xl font-semibold">{step.title}</h3><p className="mt-3 leading-relaxed text-muted-foreground">{step.text}</p><p className="mt-auto pt-8 text-sm font-medium">{step.note}</p></Reveal></li>)}
            </ol>
          </section>

          <section className="home-demo-band" aria-labelledby="demo-title">
            <div className="page-container home-section grid items-center gap-12 lg:grid-cols-2">
              <Reveal><p className="home-eyebrow">02 / Entra en modo detective</p><h2 id="demo-title" className="home-heading">Una pista puede<br />cambiarlo <span className="text-primary">todo.</span></h2><p className="home-lead">Imagina que el personaje es un pirata. Todos intentan demostrar que lo conocen… y alguien intenta encajar.</p><div className="mt-8 flex items-start gap-3"><Fingerprint className="mt-1 size-6 shrink-0 text-accent" aria-hidden="true" /><p className="max-w-sm text-muted-foreground">Lee las tres pistas. Toca al jugador que te parezca más sospechoso y después descubre el secreto.</p></div><p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">Ejemplo ilustrativo · no es una partida en vivo</p></Reveal>
              <Reveal className="home-demo">
                <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-sm font-medium"><Swords className="size-4" aria-hidden="true" />El personaje: un pirata</span><span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">3 pistas, 1 impostor</span></div>
                <div className="space-y-3">
                  {[{ name: "Luna", image: 7, word: "Tesoro" }, { name: "Nico", image: 1, word: "Barco" }, { name: "Mora", image: 8, word: "Vacaciones" }].map((player, index) => <motion.button key={player.name} type="button" aria-pressed={selected === index} onClick={() => { setSelected(index); setRevealed(false); }} whileHover={reduced ? undefined : { x: 4 }} className={`home-clue rounded-md ${selected === index ? "border-accent bg-accent/10" : "border-border bg-background/50"}`}><img src={`/avatar${player.image}.webp`} alt="" className="size-16 shrink-0 object-contain" /><span className="min-w-0 flex-1 text-left"><span className="block text-xs text-muted-foreground">{player.name} dice…</span><span className="block text-xl font-semibold">«{player.word}»</span></span><span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${selected === index ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>{selected === index && <Check className="size-4" aria-hidden="true" />}</span></motion.button>)}
                </div>
                <Button className="home-button mt-6 w-full" onClick={() => setRevealed(!revealed)} aria-expanded={revealed} aria-controls="demo-answer">{revealed ? "Ocultar el secreto" : "Revelar al impostor"}<Eye aria-hidden="true" /></Button>
                <div id="demo-answer" aria-live="polite">{revealed && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-5"><p className="font-semibold">{selected === null ? "¡Era Mora!" : selected === 2 ? "¡Detective, acertaste! Era Mora." : "¡Mora pasó desapercibida!"}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">No conocía al personaje. «Vacaciones» fue su intento de seguir la pista de «barco». En tu partida, tú decides a quién creer.</p></motion.div>}</div>
              </Reveal>
            </div>
          </section>

          <section className="page-container home-section" aria-labelledby="cast-title">
            <Reveal className="home-section-heading text-center"><p className="home-eyebrow justify-center">03 / El ingrediente secreto es tu grupo</p><h2 id="cast-title" className="home-heading">Elige tu cara.<br />Que no te <span className="text-accent">delate.</span></h2><p className="home-lead mx-auto">El que sospecha de todos. La que se ríe cuando miente. El que habla demasiado. Ya sabes a quién vas a invitar.</p></Reveal>
            <div className="home-avatar-line" aria-hidden="true">
              {[7, 2, 4, 1, 5, 8].map((id, index) => (
                <div key={id} className="home-avatar-slot">
                  <motion.div
                    className="pointer-events-none"
                    initial={reduced ? false : { y: 24, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <img src={`/avatar${id}.webp`} alt="" draggable={false} className="w-full min-w-0 object-contain" />
                  </motion.div>
                </div>
              ))}
            </div>
            <Reveal className="home-finale"><span className="home-eyebrow justify-center"><Sparkles className="size-5" aria-hidden="true" />La próxima sospecha tiene nombre y apellido</span><h2 className="home-heading">¿Quién de tus amigos<br />mentirá mejor?</h2><p className="home-lead mx-auto">Crea una sala, comparte el código y que empiecen las teorías.</p><div className="home-actions justify-center"><Button asChild className="home-button"><Link to={isLoggedIn ? "/menu" : "/signup"}>{isLoggedIn ? "Ir al menú" : "Empezar la aventura"}<ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="outline" className="home-button"><Link to="/join">Unirme a mis amigos</Link></Button></div></Reveal>
          </section>
        </main>
        <footer className="page-container flex flex-wrap items-center justify-between gap-5 border-t border-border py-8 text-sm text-muted-foreground"><Link to="/" className="text-lg font-semibold text-foreground">CharacterUs<span className="text-accent"> ✦</span></Link><p>Confía en tus amigos. O casi.</p><a href="#home-title" className="underline-offset-4 hover:underline">Volver arriba ↑</a></footer>
      </div>
    </MotionConfig>
  );
}
