import axios, { AxiosInstance } from 'axios';

export interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete' | 'patch'> {
  get<T = any, R = T, D = any>(url: string, config?: any): Promise<R>;
  delete<T = any, R = T, D = any>(url: string, config?: any): Promise<R>;
  post<T = any, R = T, D = any>(url: string, data?: D, config?: any): Promise<R>;
  put<T = any, R = T, D = any>(url: string, data?: D, config?: any): Promise<R>;
  patch<T = any, R = T, D = any>(url: string, data?: D, config?: any): Promise<R>;
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
}) as CustomAxiosInstance;

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    // If our backend sends { success: true, data: ... }, extract the data
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (!response.data.success) {
        return Promise.reject(new Error(response.data.message));
      }
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  },
);

export default api;
