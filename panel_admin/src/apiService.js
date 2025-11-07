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
      // Redirige a la página de login.
      // Usamos window.location para forzar un refresco completo,
      // lo que reiniciará el estado de la aplicación.
      window.location.href = '/lete/panel/';
    }
    return Promise.reject(error);
  }
);

export default api;
