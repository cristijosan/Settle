import axios, { AxiosInstance } from 'axios';
import { APIKeyProvider, UserAgentProvider } from './Providers';
import { parseError, RequestError } from './RequestError';

const BASE_URL = "https://testing-settlements.laravel.cloud/api/"

class NetworkManager {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
    });

    this.api.interceptors.request.use((config) => {
      config.headers['X-API-KEY'] = APIKeyProvider();
      config.headers['User-Agent'] = UserAgentProvider();
      config.headers['Accept'] = 'application/json';
      return config;
    });
  }

  async sendRequest<T>(method: 'get' | 'post', path: string, data?: any): Promise<T> {
    try {
      const response = await this.api.request({
        method,
        url: path,
        data,
      });
      if (response.data && response.data.success === true) {
        return response.data.data;
      } else {
        throw RequestError.DecodingError;
      }
    } catch (error) {
      throw parseError(error);
    }
  }
}

export const api = new NetworkManager();