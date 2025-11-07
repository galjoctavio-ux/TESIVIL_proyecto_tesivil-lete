import axios from 'axios';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: VITE_API_BASE_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/lete/app/';
    }
    return Promise.reject(error);
  }
);

export default api;
