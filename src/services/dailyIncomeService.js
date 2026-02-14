import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const storeDailyIncome = async (token, data) => {
  const response = await axios.post(`${API_URL}/daily-incomes`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
