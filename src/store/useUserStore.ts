import { create } from "zustand";

interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  isGuest: boolean;
}

interface UserState {
  user: User | null;
  isLoggedIn: boolean;

  loginAsGuest: (username: string) => void;
  login: (email: string, password: string) => void;
  signup: (username: string, email: string, password: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const defaultAvatars = [
  "/avatar1.webp",
  "/avatar2.webp",
  "/avatar3.webp",
  "/avatar4.webp",
  "/avatar5.webp",
  "/avatar6.webp",
  "/avatar7.webp",
  "/avatar8.webp",
];

const getRandomAvatar = () =>
  defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,

  loginAsGuest: (username) =>
    set({
      user: {
        id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        username,
        email: "",
        avatar: getRandomAvatar(),
        isGuest: true,
      },
      isLoggedIn: false,
    }),

  login: (email) =>
    set({
      user: {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        username: email.split("@")[0],
        email,
        avatar: getRandomAvatar(),
        isGuest: false,
      },
      isLoggedIn: true,
    }),

  signup: (username, email) =>
    set({
      user: {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        username,
        email,
        avatar: getRandomAvatar(),
        isGuest: false,
      },
      isLoggedIn: true,
    }),

  logout: () => set({ user: null, isLoggedIn: false }),

  setUser: (user) => set({ user, isLoggedIn: !user.isGuest }),
}));
