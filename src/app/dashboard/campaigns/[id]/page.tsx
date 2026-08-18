'use client';

import { use, useEffect, useState } from 'react';
import { CampaignForm } from '@/components/campaign/campaign-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useIkasToken } from '@/app/hooks/use-ikas-token';
import { ApiRequests } from '@/lib/api-requests';
import { useT } from '@/lib/i18n';
import type { Campaign } from '@/models/campaign';

export default function CampaignEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useT();
  const { id } = use(params);
  const { token, ready } = useIkasToken();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [pendingPublish, setPendingPublish] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    ApiRequests.ikas
      .getCampaign(token, id)
      .then((response) => {
        if (cancelled) return;
        const found = response.data?.data?.campaign;
        if (found) {
          setCampaign(found);
          setPendingPublish(response.data?.data?.pendingPublish ?? false);
        } else {
          setError(t('editor.notFound'));
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('editor.loadFailed'));
      });

    return () => {
      cancelled = true;
    };
  }, [token, id, t]);

  if (ready && !token) {
    return <p className="p-10 text-center text-sm text-muted-foreground">{t('common.iframeOnly')}</p>;
  }

  if (error) {
    return <p className="p-10 text-center text-sm text-muted-foreground">{error}</p>;
  }

  if (!campaign || !token) {
    return (
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return <CampaignForm campaign={campaign} token={token} initialPendingPublish={pendingPublish} />;
}
