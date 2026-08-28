import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://signalflare-web.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('signalflare_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to format errors nicely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected connection error occurred';
    if (error.response) {
      const { status, data } = error.response;
      if (data && data.error) {
        message = data.error;
      } else if (status === 400) {
        message = 'Bad Request: Please check your input parameters.';
      } else if (status === 401) {
        message = 'Unauthorized: Access token has expired or is invalid.';
      } else if (status === 403) {
        message = 'Forbidden: You do not have permissions to access this feature.';
      } else if (status === 404) {
        message = 'Not Found: The requested resource could not be located.';
      } else if (status === 409) {
        message = 'Conflict: Resource already exists or states conflict.';
      } else if (status === 429) {
        message = 'Too Many Requests: Please slow down and try again later.';
      } else if (status >= 500) {
        message = 'Server Error: Critical error in remote backend dispatcher.';
      }
    } else if (error.request) {
      message = 'Network error: Remote server is unreachable. Check internet connection.';
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
