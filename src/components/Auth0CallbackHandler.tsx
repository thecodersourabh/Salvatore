import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  AUTH_CODE_SESSION_KEY,
  DEEP_LINK_SCHEMES,
  REDIRECT_DELAYS,
  STORAGE_PREFIXES,
} from '../constants';

type RedirectCallbackHandler = (url?: string) => Promise<unknown>;

export function Auth0CallbackHandler() {
  const { handleRedirectCallback } = useAuth0();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isDisposed = false;
    let removeListener: (() => Promise<void>) | undefined;

    const registerListener = async () => {
      const listener = await CapApp.addListener('appUrlOpen', async ({ url }) => {
        try {
          await handleDeepLink(url, handleRedirectCallback);
        } catch (error) {
          console.error('Failed to process app URL:', error);
        }
      });

      if (isDisposed) {
        await listener.remove();
        return;
      }

      removeListener = () => listener.remove();
    };

    registerListener().catch((error: unknown) => {
      console.error('Failed to register app URL listener:', error);
    });

    return () => {
      isDisposed = true;
      if (removeListener) {
        void removeListener().catch((error: unknown) => {
          console.error('Failed to remove app URL listener:', error);
        });
      }
    };
  }, [handleRedirectCallback]);

  return null;
}

async function handleDeepLink(url: string, handleRedirectCallback: RedirectCallbackHandler) {
  try {
    if (url.includes(DEEP_LINK_SCHEMES.LOGOUT)) {
      clearAuthData();
      redirectToHome();
      return;
    }

    if (url.includes('state') && (url.includes('code') || url.includes('error'))) {
      const code = extractCodeFromUrl(url);

      if (isDuplicateCode(code)) return;
      if (code) sessionStorage.setItem(AUTH_CODE_SESSION_KEY, code);

      await processAuthCallback(url, handleRedirectCallback);
    }
  } finally {
    await closeBrowser();
  }
}

function clearAuthData() {
  sessionStorage.removeItem(AUTH_CODE_SESSION_KEY);
  clearStorageByPrefix(STORAGE_PREFIXES.AUTH0);
}

function clearStorageByPrefix(prefixes: readonly string[]) {
  [localStorage, sessionStorage].forEach((storage) => {
    Object.keys(storage).forEach((key) => {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        storage.removeItem(key);
      }
    });
  });
}

function redirectToHome() {
  setTimeout(() => {
    window.location.hash = '/';
    window.location.reload();
  }, REDIRECT_DELAYS.LOGOUT);
}

function extractCodeFromUrl(url: string): string | null {
  return new URLSearchParams(url.split('?')[1] || '').get('code');
}

function isDuplicateCode(code: string | null): boolean {
  return code !== null && code === sessionStorage.getItem(AUTH_CODE_SESSION_KEY);
}

async function processAuthCallback(url: string, handleRedirectCallback: RedirectCallbackHandler) {
  try {
    await handleRedirectCallback(url);
    redirectToDashboard();
  } catch (error: unknown) {
    handleAuthError(error);
  }
}

function redirectToDashboard() {
  setTimeout(() => {
    window.location.hash = '/';
  }, REDIRECT_DELAYS.SUCCESS);
}

function handleAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const isNetworkError =
    message.includes('Failed to fetch') ||
    message.includes('CORS') ||
    message.includes('Network request failed');
  const isCodeError = message.includes('Invalid authorization code');

  if (isNetworkError || isCodeError) {
    redirectToDashboard();
  } else {
    setTimeout(() => {
      window.location.hash = '/auth?error=callback_failed';
    }, REDIRECT_DELAYS.ERROR);
  }
}

async function closeBrowser() {
  try {
    await Browser.close();
  } catch {
    // Browser close may fail on Android.
  }
}
