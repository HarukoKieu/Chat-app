import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },

  clearState: () => {
    set({
      accessToken: null,
      user: null,
      loading: false,
    });
  },

  signUp: async (surname, name, username, email, password) => {
    try {
      set({ loading: true });

      const { accessToken, user } = await authService.signUp(
        surname,
        name,
        username,
        email,
        password,
      );
      set({ accessToken, user });

      toast.success("Account created & logged in!");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Sign up failed");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (username, password) => {
    try {
      set({ loading: true });
      const { accessToken } = await authService.signIn(username, password);
      get().setAccessToken(accessToken);

      await get().fetchMe();

      toast.success("Sign in successful");
    } catch (error) {
      console.error(error);
      toast.error("Sign in failed! Please try again.");
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await authService.signOut();
      get().clearState();
      toast.success("Log out successful");
    } catch (error) {
      console.error(error);
      toast.error("Log out failed! Please try again.");
    } finally {
      set({ loading: false });
    }
  },

  fetchMe: async () => {
    try {
      set({ loading: true });
      const user = await authService.fetchMe();
      set({ user });
    } catch (error) {
      console.error(error);
      set({ user: null, accessToken: null });
      toast.error("Error while fetching user data! Please try again.");
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    if (!get().accessToken) return;
    try {
      set({ loading: true });
      const { user, fetchMe, setAccessToken } = get();
      const accessToken = await authService.refresh();
      setAccessToken(accessToken);

      if (!user) {
        await fetchMe();
      }
    } catch (error) {
      console.error(error);
      get().clearState();
      toast.error("Login session expired! Please login again.");
    } finally {
      set({ loading: false });
    }
  },
}));
