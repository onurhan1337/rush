'use client';

import { AppBridgeHelper } from '@ikas/app-helpers';
import { useEffect, useState } from 'react';
import { TokenHelpers } from '@/helpers/token-helpers';

export function useIkasToken() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AppBridgeHelper.closeLoader();
  }, []);

  useEffect(() => {
    let cancelled = false;

    TokenHelpers.getTokenForIframeApp()
      .then((fetched) => {
        if (cancelled) return;
        setToken(fetched);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { token, ready };
}
