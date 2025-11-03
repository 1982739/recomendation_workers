const axios = require('axios');

const apiClient = axios.create({
  baseURL: process.env.API_GATEWAY_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor: agrega token Auth0 automáticamente a cada request
apiClient.interceptors.request.use(async (config) => {
  const token = await authService.getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

module.exports = apiClient;