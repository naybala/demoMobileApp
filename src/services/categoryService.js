import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getCategories = async (token) => {
  const response = await axios.get(`${API_URL}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};
