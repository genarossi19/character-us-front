import { useState } from "react";
import { ScanFace } from "lucide-react";

interface CharacterPortraitProps {
  imageUrl?: string | null;
  name?: string | null;
  fallbackClassName: string;
}

export default function CharacterPortrait({ imageUrl, name, fallbackClassName }: CharacterPortraitProps) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return <ScanFace className={fallbackClassName} aria-hidden="true" />;
  }

  return (
    <img
      src={imageUrl}
      alt={name ?? "Personaje"}
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
