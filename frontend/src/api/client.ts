import axios from 'axios';

// BFF runs on port 8000
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth routes that should not trigger redirects to prevent loops
const AUTH_PATHS = ['/(auth)/', '/login', '/api/auth/'];
const isAuthRoute = (pathname: string) => AUTH_PATHS.some(path => pathname.includes(path));

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      // Prevent infinite redirect loop - only redirect if not already in auth flow
      if (!isAuthRoute(window.location.pathname)) {
        console.trace('API client interceptor triggering redirect to /login');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const customInstance = <T>(config: any): Promise<T> => {
  return apiClient(config).then(({ data }) => data);
};

export default apiClient;