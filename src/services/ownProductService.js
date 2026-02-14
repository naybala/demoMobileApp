import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getOwnProducts = async (token) => {
  const response = await axios.get(`${API_URL}/own-products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};
