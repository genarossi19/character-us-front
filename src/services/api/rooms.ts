import { authenticatedApi, getApiError } from "./client";
import type { RoomMode, RoomSettings } from "@/types/game";

export interface PublicRoomSummary {
  id: string;
  code: number;
  name: string;
  categoryId: string;
  mode: RoomMode;
  playMode: NonNullable<RoomSettings["playMode"]>;
  impostorCount: number;
  playerCount: number;
  maxPlayers: number;
}

export async function fetchPublicRooms(signal: AbortSignal): Promise<PublicRoomSummary[]> {
  try {
    const { data } = await authenticatedApi.get<{ rooms: PublicRoomSummary[] }>("/rooms/public", {
      signal,
      timeout: 5_000,
    });
    if (!Array.isArray(data?.rooms)) throw new Error("El servidor no devolvió un listado válido.");
    return data.rooms;
  } catch (error) {
    throw getApiError(error);
  }
}
