import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://plywood.onrender.com/api'
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('labour_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;
