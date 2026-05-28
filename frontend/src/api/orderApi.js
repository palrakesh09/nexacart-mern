import axiosClient from "./axiosClient";

export const createOrder = async (payload) => {
  const response = await axiosClient.post("/orders", payload);
  return response.data;
};

export const fetchMyOrders = async () => {
  const response = await axiosClient.get("/orders/my-orders");
  return response.data;
};

export const fetchOrders = async () => {
  const response = await axiosClient.get("/orders");
  return response.data;
};

export const fetchOrderById = async (id) => {
  const response = await axiosClient.get(`/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, payload) => {
  const response = await axiosClient.put(`/orders/${id}`, payload);
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await axiosClient.delete(`/orders/${id}`);
  return response.data;
};
