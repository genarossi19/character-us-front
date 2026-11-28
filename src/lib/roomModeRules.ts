import type { RoomMode, RoomSettings } from "@/types/game";

const modeRules: Record<RoomMode, Pick<RoomSettings, "impostorsKnowEachOther" | "visibleVotes">> = {
  classic: { impostorsKnowEachOther: true, visibleVotes: true },
  anonymous: { impostorsKnowEachOther: false, visibleVotes: false },
};

export function applyRoomModeRules(settings: RoomSettings): RoomSettings {
  return { ...settings, ...modeRules[settings.mode] };
}

export function getMinimumPlayers(impostorCount: number): number {
  return Math.max(3, impostorCount * 2 + 1);
}

export function getMaxImpostors(capacity: number): number {
  return Math.min(3, Math.floor((capacity - 1) / 2));
}
