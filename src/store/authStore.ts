import { create } from "zustand";

type User = { id: string; name: string; email: string };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;

  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

const TOKEN_KEY = "access_token";
const USER_KEY = "lms_user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, accessToken: token, isAuthenticated: true });
  },

  setAccessToken: (token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
    set({ accessToken: token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    let user: User | null = null;
    try {
      if (raw) user = JSON.parse(raw);
    } catch {
      /* corrupted */
    }
    set({
      accessToken: token,
      user,
      isAuthenticated: Boolean(token),
      hydrated: true,
    });
  },
}));
