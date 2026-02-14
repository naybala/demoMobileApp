import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data; // Includes code, status, message, and data (user_info, token)
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};

export const logout = async (token, id) => {
  console.log(token, id);

  try {
    const response = await axios.post(
      `${API_URL}/logout`,
      { id: id },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Logout error:", error.response?.data || error.message);
    throw error;
  }
};
