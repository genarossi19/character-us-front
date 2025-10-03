import { Link } from "react-router";
import { Button } from "./ui/button";

// Navigation links array to be used in both desktop and mobile menus

export default function NavMenu() {
  return (
    <header className=" px-4 md:px-6 bg-gradient-to-br ">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2">
          {/* Main nav */}
          <div className="flex items-center gap-6">
            <a href="#" className="">
              <div className="flex items-center gap-4">
                <img className="h-12 w-12 rounded-md" src="/logo.webp" alt="" />
                <span className="text-5xl font-extrabold bg-gradient-to-b from-accent/60 via-accent/80 to-accent bg-clip-text text-transparent">
                  CharacterUs
                </span>
              </div>
            </a>
          </div>
        </div>
        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="text-md transition-colors ease-in-out duration-150"
          >
            <Link to={"/login"}>Login</Link>
          </Button>
          <Button asChild size="lg" className="text-md">
            <Link to={"/join"}>Join Game </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
