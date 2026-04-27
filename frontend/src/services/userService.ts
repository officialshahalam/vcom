import { api } from "./api";

export const userService = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: { fullName?: string; username?: string; bio?: string; profilePicture?: string | null }) =>
    api.put("/user/profile", data),
  search: (query: string) => api.get(`/user/search?q=${encodeURIComponent(query)}`),
  getPublicProfile: (userId: number) => api.get(`/user/${userId}`),
};
