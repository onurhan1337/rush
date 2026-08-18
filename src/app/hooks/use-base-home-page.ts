'use client';

import { AppBridgeHelper } from '@ikas/app-helpers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TokenHelpers } from '@/helpers/token-helpers';

export function useBaseHomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initializeAuthFlow = async () => {
      try {
        AppBridgeHelper.closeLoader();

        const existingToken = await TokenHelpers.getTokenForIframeApp();

        if (existingToken) {
          router.push('/dashboard');
          return;
        }

        await handleAuthorizationFlow();

      } catch (error) {
        console.error('Error during base home page initialization:', error);
        
        router.push('/authorize-store');
      } finally {
        setIsLoading(false);
      }
    };

    const handleAuthorizationFlow = async () => {
      if (window.self === window.top) {
        const urlParams = new URLSearchParams(window.location.search);
        const storeName = urlParams.get('storeName');

        if (storeName) {
          window.location.replace(`/api/oauth/authorize/ikas?storeName=${storeName}`);
          return;
        }
      }

      router.push('/authorize-store');
    };

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    initializeAuthFlow();

    return () => {};
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading };
}
