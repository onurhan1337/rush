'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScopeBanner } from '@/components/dashboard/scope-banner';
import { useIkasToken } from '@/app/hooks/use-ikas-token';
import { ApiRequests } from '@/lib/api-requests';
import { useT } from '@/lib/i18n';
import type { ScriptStatus } from '@/lib/storefront-script';

export default function SettingsPage() {
  const t = useT();
  const { token, ready } = useIkasToken();
  const [statuses, setStatuses] = useState<ScriptStatus[] | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    ApiRequests.ikas
      .getScript(token)
      .then((response) => {
        if (cancelled) return;
        setStatuses(response.data?.data?.statuses ?? []);
        setBaseUrl(response.data?.data?.baseUrl ?? '');
      })
      .catch(() => {
        if (!cancelled) setStatuses([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const run = useCallback(
    async (action: 'install' | 'uninstall') => {
      if (!token) return;
      setBusy(true);
      try {
        const response = action === 'install' ? await ApiRequests.ikas.installScript(token) : await ApiRequests.ikas.uninstallScript(token);
        setStatuses(response.data?.data?.statuses ?? []);
        setBaseUrl(response.data?.data?.baseUrl ?? '');
        toast.success(t(action === 'install' ? 'settings.installSuccess' : 'settings.uninstallSuccess'));
      } catch {
        toast.error(t('common.actionFailed'));
      } finally {
        setBusy(false);
      }
    },
    [token, t],
  );

  const isLocal = /localhost|127\.0\.0\.1/.test(baseUrl);

  if (ready && !token) {
    return <p className="p-10 text-center text-sm text-muted-foreground">{t('common.iframeOnly')}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      {token ? <ScopeBanner token={token} /> : null}

      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" aria-label={t('editor.backAria')}>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-medium tracking-tight">{t('settings.title')}</h1>
      </div>

      <section className="rounded-lg border p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">{t('settings.scriptTitle')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('settings.scriptDescription')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => run('uninstall')} disabled={busy || !statuses?.some((status) => status.installed)}>
              {t('settings.uninstall')}
            </Button>
            <Button size="sm" onClick={() => run('install')} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('settings.install')}
            </Button>
          </div>
        </div>

        {baseUrl ? (
          <p className="mb-4 text-xs text-muted-foreground">
            {t('settings.servedFrom')} <code className="rounded bg-muted px-1.5 py-0.5">{baseUrl}/rush.js</code>
          </p>
        ) : null}

        {isLocal ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>{t('settings.localhostTitle')}</AlertTitle>
            <AlertDescription className="text-xs">{t('settings.localhostBody')}</AlertDescription>
          </Alert>
        ) : null}

        {statuses === null ? (
          <Skeleton className="h-16 w-full" />
        ) : statuses.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('settings.noStorefronts')}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {statuses.map((status) => (
              <li key={status.storefront.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{status.storefront.name}</span>
                  {status.storefront.domain ? <span className="text-xs text-muted-foreground">{status.storefront.domain}</span> : null}
                </div>
                <Badge variant={status.installed ? (status.upToDate ? 'default' : 'secondary') : 'outline'}>
                  {t(status.installed ? (status.upToDate ? 'settings.installed' : 'settings.outdated') : 'settings.notInstalled')}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
