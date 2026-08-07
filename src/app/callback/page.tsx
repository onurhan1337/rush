'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppBridgeHelper } from '@ikas/app-helpers';
import Loading from '@/components/Loading';
import { TokenHelpers } from '@/helpers/token-helpers';

/**
 * CallbackContent
 * - Handles the OAuth callback logic.
 * - Extracts query parameters from the URL.
 * - Sets the token using TokenHelpers and redirects as needed.
 * - Shows a loading spinner while processing.
 */
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Close the loader shown by ikas platform when opening the iframe
  useEffect(() => {
    AppBridgeHelper.closeLoader();
  }, []);

  useEffect(() => {
    // Immediately-invoked async function to handle token setting and redirect
    (async () => {
      // Convert searchParams to URLSearchParams for compatibility
      const params = new URLSearchParams(searchParams.toString());
      try {
        // Set token and handle redirect logic
        await TokenHelpers.setToken(router, params);
      } catch (error) {
        // setToken throws this sentinel once the redirect is under way. Swallowing it
        // keeps the browser from reporting an unhandled rejection on a healthy flow.
        if (error !== 'redirectUrl-called') throw error;
      }
    })();
  }, [router, searchParams]);

  // Show loading indicator while processing callback
  return <Loading />;
}

/**
 * CallbackPage
 * - Wraps CallbackContent in Suspense for async handling.
 */
export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
