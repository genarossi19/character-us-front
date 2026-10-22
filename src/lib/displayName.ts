export function getDisplayName(user: { name?: string | null; username: string } | null | undefined): string {
  return user?.name ?? user?.username ?? "Jugador";
}
