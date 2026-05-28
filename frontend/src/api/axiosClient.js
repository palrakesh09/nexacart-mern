import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:5000/api"
    : (import.meta.env.VITE_API_URL || "/api"),
});

axiosClient.interceptors.request.use((config) => {
  const persistedUser = localStorage.getItem("nexacartUser");
  if (persistedUser) {
    const { token } = JSON.parse(persistedUser);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default axiosClient;
