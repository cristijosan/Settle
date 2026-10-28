import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { parseError } from './RequestError';
import { TokenStore } from './TokenStore';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.lovoxmabuilds.md";

// Model-backed endpoints (/cv/adapt, explain=true) take up to a minute.
const DEFAULT_TIMEOUT = 30000;
export const AI_TIMEOUT = 90000;

class NetworkManager {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: { Accept: 'application/json' },
      paramsSerializer: { indexes: null },
    });

    this.api.interceptors.request.use(async (config) => {
      const token = await TokenStore.get();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.request<T>(config);
      return response.data;
    } catch (error) {
      throw parseError(error);
    }
  }

  async download(path: string, data: unknown): Promise<{ bytes: ArrayBuffer; filename: string | null }> {
    try {
      const response = await this.api.post<ArrayBuffer>(path, data, { responseType: 'arraybuffer' });
      const disposition: string = response.headers['content-disposition'] ?? '';
      const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const plain = disposition.match(/filename="([^"]+)"/i)?.[1];
      return {
        bytes: response.data,
        filename: encoded ? decodeURIComponent(encoded) : plain ?? null,
      };
    } catch (error) {
      throw parseError(error);
    }
  }

  get<T>(path: string, params?: object): Promise<T> {
    return this.request<T>({ method: 'get', url: path, params });
  }

  post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'post', url: path, data, ...config });
  }

  postForm<T>(path: string, form: FormData, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'post',
      url: path,
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' },
      ...config,
    });
  }
}

export const api = new NetworkManager();
