import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getCategories = async (token, page = 1) => {
  const response = await axios.get(`${API_URL}/categories?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(response.data);

  return response.data.data;
};

export const getCategoryDetail = async (token, id) => {
  const response = await axios.get(`${API_URL}/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
