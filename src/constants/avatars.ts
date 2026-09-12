export const AVATAR_OPTIONS = [
  { id: "avatar-1", url: "/avatars/astronaut.webp" },
  { id: "avatar-2", url: "/avatars/pirata.webp" },
  { id: "avatar-3", url: "/avatars/detective.webp" },
  { id: "avatar-4", url: "/avatars/chef.webp" },
  { id: "avatar-5", url: "/avatars/medico.webp" },
  { id: "avatar-6", url: "/avatars/artista.webp" },
  { id: "avatar-7", url: "/avatars/soldado.webp" },
  { id: "avatar-8", url: "/avatars/villano.webp" },
];

export const AVATAR_URLS: string[] = AVATAR_OPTIONS.map((a) => a.url);

export const getAvatarUrlById = (id: string): string | undefined =>
  AVATAR_OPTIONS.find((a) => a.id === id)?.url;
