import api from "@/lib/axios";

export const authService = {
  signUp: async (
    surname: string,
    name: string,
    username: string,
    email: string,
    password: string,
  ) => {
    const response = await api.post(
      "/auth/signup",
      { surname, name, username, email, password },
      { withCredentials: true },
    );
    return response.data;
  },

  signIn: async (username: string, password: string) => {
    const response = await api.post(
      "/auth/signin",
      { username, password },
      { withCredentials: true },
    );
    return response.data;
  },

  signOut: async () => {
    return api.post("/auth/signout", {}, { withCredentials: true });
  },

  fetchMe: async () => {
    const response = await api.get("/user/me", { withCredentials: true });
    return response.data;
  },

  refresh: async () => {
    const response = await api.post(
      "/auth/refresh",
      {},
      { withCredentials: true },
    );
    return response.data;
  },
};
