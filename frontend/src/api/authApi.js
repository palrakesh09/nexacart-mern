import axios from "axios";

const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000/api/auth"
  : `${import.meta.env.VITE_API_URL || "/api"}/auth`;

export const registerUser = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/register`, payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/login`, payload);
  return response.data;
};
