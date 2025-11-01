const axios = require('axios');
const authService = require('./authService');

const apiClient = axios.create({
  baseURL: process.env.API_GATEWAY_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await authService.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🌐 API Request: ${config.method.toUpperCase()} ${config.url}`);
    } catch (error) {
      console.error('❌ Failed to get auth token:', error.message);
      throw error;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar 401 (token expirado)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no hemos reintentado
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('🔄 Token expired, refreshing...');
      authService.clearToken();
      
      const token = await authService.getToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;
      
      return apiClient(originalRequest);
    }

    console.error('❌ API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

module.exports = apiClient;