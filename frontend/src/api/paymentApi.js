import axiosClient from "./axiosClient";

export const createPaymentIntent = async ({ productId, quantity = 1 }) => {
  const response = await axiosClient.post("/payments/create-payment-intent", {
    productId,
    quantity,
  });
  return response.data;
};
