import NavMenu from "../components/NavBar";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
const HomePage = () => {
  return (
    <div className="bg-background  min-h-screen flex flex-col ">
      <NavMenu />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-no-wrap justify-center max-w-[80%] ">
          <img src="/avatar7.webp" alt="" className="max-w-[33.33%]" />
          <img src="/avatar1.webp" alt="" className="max-w-[33.33%]" />
          <img src="/avatar8.webp" alt="" className="max-w-[33.33%]" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-5xl font-bold text-foreground text-balance dark:text-white">
            ¡Desafia a tus amigos y descubre al impostor!
          </h1>
          <Button
            asChild
            variant={"secondary"}
            size={"lg"}
            className="text-light animate-bounce-in mt-4 text-3xl h-12 bg-gradient-to-br from-accent to-secondary hover:from-secondary hover:to-accent dark:bg-black"
          >
            <Link to={"/signup"}>Registrarse</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
