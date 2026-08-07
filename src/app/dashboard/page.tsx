'use client';

import { CampaignList } from '@/components/dashboard/campaign-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useIkasToken } from '../hooks/use-ikas-token';
import { useT } from '@/lib/i18n';

export default function DashboardPage() {
  const t = useT();
  const { token, ready } = useIkasToken();

  if (!ready) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!token) {
    return <p className="p-10 text-center text-sm text-muted-foreground">{t('common.iframeOnly')}</p>;
  }

  return <CampaignList token={token} />;
}
