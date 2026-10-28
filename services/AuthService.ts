import { api } from '@/api/NetworkManager';
import { ApiError, RequestError } from '@/api/RequestError';
import { TokenStore } from '@/api/TokenStore';
import { AuthResponse, Usage, User } from '@/types/api';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { SubscriptionService } from './SubscriptionService';

const DEVICE_ACCOUNT_KEY = 'device_account';

interface DeviceAccount {
  email: string;
  password: string;
}

const randomHex = (bytes: number) =>
  Array.from(Crypto.getRandomBytes(bytes), (b) => b.toString(16).padStart(2, '0')).join('');

let pending: Promise<void> | null = null;

/**
 * The app has no sign-in screen. The backend still wants a bearer token for its
 * AI endpoints, so each install quietly gets its own account, whose random
 * credentials never leave the device keychain.
 */
const signInDevice = async () => {
  const saved = await SecureStore.getItemAsync(DEVICE_ACCOUNT_KEY);
  let response: AuthResponse;
  if (saved) {
    const account: DeviceAccount = JSON.parse(saved);
    response = await api.post<AuthResponse>('/auth/login', account);
  } else {
    const account: DeviceAccount = {
      email: `device-${randomHex(12)}@devices.cvsender.app`,
      password: randomHex(24),
    };
    response = await api.post<AuthResponse>('/auth/register', account);
    await SecureStore.setItemAsync(DEVICE_ACCOUNT_KEY, JSON.stringify(account));
  }
  await TokenStore.set(response.access_token);
  SubscriptionService.identify(response.user.id).catch((error) =>
    console.warn('Could not link the subscription to the device account', error)
  );
};

export const AuthService = {
  /** Makes sure a token exists; safe to call before every protected request. */
  async ensureSession(): Promise<void> {
    if (await TokenStore.get()) return;
    pending ??= signInDevice().finally(() => {
      pending = null;
    });
    return pending;
  },

  /** Drops an expired token and signs the device in again. */
  async refreshSession(): Promise<void> {
    await TokenStore.set(null);
    return this.ensureSession();
  },

  /** Runs a protected request, signing in first and once more if the token expired. */
  async withSession<T>(request: () => Promise<T>): Promise<T> {
    await this.ensureSession();
    try {
      return await request();
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== RequestError.Authentication) throw error;
      await this.refreshSession();
      return request();
    }
  },

  me(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  /** `costs` is the live price table; an endpoint absent from it is free. */
  usage(): Promise<Usage> {
    return api.get<Usage>('/auth/usage');
  },
};
