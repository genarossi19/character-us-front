import NavMenu from "../components/NavBar";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
const HomePage = () => {
  return (
    <div className="bg-background  min-h-screen flex flex-col ">
      <NavMenu />

      <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-5 py-10 sm:py-14">
        <div className="flex w-full max-w-2xl justify-center" aria-hidden="true">
          <img src="/avatar7.webp" alt="" className="w-1/3 min-w-0 object-contain" />
          <img src="/avatar1.webp" alt="" className="w-1/3 min-w-0 object-contain" />
          <img src="/avatar8.webp" alt="" className="w-1/3 min-w-0 object-contain" />
        </div>
        <div className="flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold leading-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
            ¡Desafía a tus amigos y descubre al impostor!
          </h1>
          <Button
            asChild
            variant={"secondary"}
            size={"lg"}
            className="mt-4 h-12 w-full max-w-xs animate-bounce-in bg-gradient-to-br from-accent to-secondary text-xl text-light hover:from-secondary hover:to-accent sm:w-auto sm:text-2xl"
          >
            <Link to={"/signup"}>Registrarse</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
