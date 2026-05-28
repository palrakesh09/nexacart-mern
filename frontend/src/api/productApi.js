import axiosClient from "./axiosClient";

export const fetchProducts = async (keyword = "") => {
  const response = await axiosClient.get("/products", {
    params: keyword ? { keyword } : {},
  });
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await axiosClient.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (payload) => {
  const response = await axiosClient.post("/products", payload);
  return response.data;
};

export const updateProduct = async (id, payload) => {
  const response = await axiosClient.put(`/products/${id}`, payload);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await axiosClient.delete(`/products/${id}`);
  return response.data;
};
