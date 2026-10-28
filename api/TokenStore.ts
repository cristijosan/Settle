import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'access_token';

let cached: string | null | undefined;

export const TokenStore = {
  async get(): Promise<string | null> {
    if (cached === undefined) {
      cached = await AsyncStorage.getItem(KEY);
    }
    return cached;
  },

  async set(token: string | null) {
    cached = token;
    if (token) {
      await AsyncStorage.setItem(KEY, token);
    } else {
      await AsyncStorage.removeItem(KEY);
    }
  },
};
