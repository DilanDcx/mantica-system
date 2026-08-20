import axios from 'axios';

// Obtener la URL base desde las variables de entorno o localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 1. Interceptor de Peticiones: Inyectar Access Token si existe
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor de Respuestas: Manejo y renovación automática ante error 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos intentado reintentar esta petición aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      // Si no hay refresh token, cerrar sesión
      if (!refreshToken) {
        logoutAndRedirect();
        return Promise.reject(error);
      }

      try {
        // Petición directa con axios base (sin interceptores) para evitar bucles infinitos
        const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        // Actualizar la cabecera de la petición original y reintentarla
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // El refresh token expiró o es inválido
        logoutAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Función auxiliar para limpiar almacenamiento y redirigir
const logoutAndRedirect = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
};

export default axiosClient;