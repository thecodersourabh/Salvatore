import { Capacitor } from '@capacitor/core';

export const getRedirectUri = () => {
  // Handle mobile app
  if (Capacitor.isNativePlatform()) {
    return 'com.texweb.app://callback';
  }
  
  // Handle web app
  const isDeployed = window.location.hostname === 'thecodersourabh.github.io';
  return isDeployed
    ? 'https://thecodersourabh.github.io/TexWeb/'
    : 'http://localhost:4173';
};

export const getLogoutUri = () => {
  // Handle mobile app
  if (Capacitor.isNativePlatform()) {
    return 'com.texweb.app://logout';
  }
  
  // Handle web app
  const isDeployed = window.location.hostname === 'thecodersourabh.github.io';
  return isDeployed
    ? 'https://thecodersourabh.github.io/TexWeb/#/'
    : 'http://localhost:4173/#/';
};
