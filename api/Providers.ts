import CryptoJS from 'crypto-js';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const SECRET = "settlements-testing";

export const UserAgentProvider = () => {
  const appVersion = Constants.expoConfig?.version || "0.0.1";
  const systemVersion = Device.osVersion;
  const model = Device.modelName;
  return `Settlements/${appVersion} (iOS; ${systemVersion}; ${model})`;
};

export const APIKeyProvider = () => {
  const userAgent = UserAgentProvider();
  const utcHour = new Date().getUTCHours();
  const message = `${userAgent}|${utcHour}`;
  
  return CryptoJS.HmacSHA256(message, SECRET).toString(CryptoJS.enc.Hex);
};