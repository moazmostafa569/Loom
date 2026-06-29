import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'https://route-posts.routemisr.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
