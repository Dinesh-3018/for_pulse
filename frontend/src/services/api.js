import axios from "axios";
import API_BASE_URL from "../config";

const API_URL = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const onboardingService = {
  getStatus: async () => {
    const response = await api.get("/onboarding/status");
    return response.data;
  },
  savePreferences: async (preferences) => {
    const response = await api.put("/onboarding/preferences", preferences);
    return response.data;
  },
  updateStep: async (step) => {
    const response = await api.put("/onboarding/step", { step });
    return response.data;
  },
  complete: async () => {
    const response = await api.post("/onboarding/complete");
    return response.data;
  },
};

export const videoService = {
  upload: async (formData, onUploadProgress) => {
    const response = await api.post("/videos/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data;
  },
  getVideos: async (params) => {
    const response = await api.get("/videos", { params });
    return response.data;
  },
  getVideo: async (id) => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },
  getStreamUrl: (id) => `${API_URL}/videos/stream/${id}`,
};

export const superAdminService = {
  getDashboard: async () => {
    const response = await api.get("/superadmin/dashboard");
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get("/superadmin/users");
    return response.data;
  },
  deleteUser: async (userId) => {
    const response = await api.delete(`/superadmin/users/${userId}`);
    return response.data;
  },
  getAllVideos: async () => {
    const response = await api.get("/superadmin/videos");
    return response.data;
  },
  deleteVideo: async (videoId) => {
    const response = await api.delete(`/superadmin/videos/${videoId}`);
    return response.data;
  },
  getQuotaStatus: async () => {
    const response = await api.get("/superadmin/quota");
    return response.data;
  },
};

export default api;
