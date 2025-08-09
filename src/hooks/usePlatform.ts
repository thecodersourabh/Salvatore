import { Capacitor } from '@capacitor/core';

export const usePlatform = () => {
  const platform = {
    isWeb: !Capacitor.isNativePlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios',
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform()
  };

  return platform;
};
