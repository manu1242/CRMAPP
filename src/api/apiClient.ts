import { AxiosRequestConfig } from 'axios';
import { axiosInstance } from './axios';

export const apiClient = {
  get: async <T>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.get<T>(url, { params, ...config });
    return response.data;
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },

  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  postForm: async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  },

  putForm: async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosInstance.put<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  },

  download: async (url: string, config?: AxiosRequestConfig): Promise<Blob> => {
    const response = await axiosInstance.get(url, { responseType: 'blob', ...config });
    return response.data;
  },
};
