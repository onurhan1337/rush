'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppBridgeHelper } from '@ikas/app-helpers';
import Loading from '@/components/Loading';
import { TokenHelpers } from '@/helpers/token-helpers';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    AppBridgeHelper.closeLoader();
  }, []);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(searchParams.toString());
      try {
        await TokenHelpers.setToken(router, params);
      } catch (error) {
        if (error !== 'redirectUrl-called') throw error;
      }
    })();
  }, [router, searchParams]);

  return <Loading />;
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
