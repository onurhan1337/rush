'use client';

import { AppBridgeHelper } from '@ikas/app-helpers';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { config } from '@/globals/config';
import { ApiRequests } from '@/lib/api-requests';
import { useT } from '@/lib/i18n';

export function ScopeBanner({ token }: { token: string }) {
  const t = useT();
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    ApiRequests.ikas
      .getScope(token)
      .then((response) => {
        if (!cancelled) setMissing(response.data?.data?.missing ?? []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token]);

  const reauthorize = useCallback(() => {
    AppBridgeHelper.reAuthorizeApp({
      redirectUri: config.oauth.redirectUri,
      scope: config.oauth.scope,
      state: 'rush-scope-upgrade',
    });
  }, []);

  if (!missing.length) return null;

  return (
    <Alert className="mb-6">
      <AlertTitle>{t('scope.title')}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span className="text-muted-foreground">
          {t('scope.description')} {missing.join(', ')}
        </span>
        <Button size="sm" className="w-fit" onClick={reauthorize}>
          {t('scope.action')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
