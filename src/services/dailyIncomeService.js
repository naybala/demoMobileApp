import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getDailyIncomes = async (token, params = {}) => {
  const { page = 1, search = "", from_date = "", to_date = "" } = params;
  let url = `${API_URL}/daily-incomes?page=${page}`;
  if (search) url += `&search=${search}`;
  if (from_date) url += `&from_date=${from_date}`;
  if (to_date) url += `&to_date=${to_date}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.data;
};

export const getDailyIncomeDetail = async (token, id) => {
  const response = await axios.get(`${API_URL}/daily-incomes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateDailyIncome = async (token, id, data) => {
  const response = await axios.put(`${API_URL}/daily-incomes/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const storeDailyIncome = async (token, data) => {
  const response = await axios.post(`${API_URL}/daily-incomes`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
