import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";

export const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : "/api",
  withCredentials: true,
});

// Assign the access token to the request headers
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// auto call refresh token when access token is expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url.includes("/auth/refresh") ||
      originalRequest.url.includes("/auth/signin") ||
      originalRequest.url.includes("/auth/signup")
    ) {
      return Promise.reject(error);
    }

    //
    originalRequest._retryCount = originalRequest._retryCount || 0;

    if (error.response?.status === 403 && originalRequest._retryCount < 5) {
      originalRequest._retryCount++;
      try {
        const response = await api.post("/auth/refresh", {
          withCredentials: true,
        });
        const newAccessToken = response.data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearState();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
export default api;
