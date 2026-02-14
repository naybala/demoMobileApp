import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getOwnProducts = async (token, page = 1) => {
  const response = await axios.get(`${API_URL}/own-products?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

export const getOwnProductDetail = async (token, id) => {
  const response = await axios.get(`${API_URL}/own-products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
