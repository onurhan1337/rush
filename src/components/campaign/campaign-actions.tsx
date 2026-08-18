'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pause, Rocket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiRequests } from '@/lib/api-requests';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { Campaign } from '@/models/campaign';

type Props = {
  campaign: Campaign;
  token: string;
  saving: boolean;
  savedAt: Date | null;
  pendingPublish: boolean;
  onBeforePublish: () => Promise<boolean>;
  onCampaignChange: (campaign: Campaign, pendingPublish: boolean) => void;
};

export function CampaignActions({ campaign, token, saving, savedAt, pendingPublish, onBeforePublish, onCampaignChange }: Props) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async (action: 'publish' | 'pause') => {
    if (action === 'publish') {
      const valid = await onBeforePublish();
      if (!valid) {
        toast.error(t('editor.invalidForm'));
        return;
      }
    }

    setBusy(true);
    try {
      const response = await ApiRequests.ikas.publishCampaign(token, campaign.id, action);
      const next = response.data?.data?.campaign;
      if (next) {
        onCampaignChange(next, response.data?.data?.pendingPublish ?? false);
        toast.success(t(action === 'publish' ? 'editor.published' : 'editor.paused'));
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(message || t('common.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await ApiRequests.ikas.deleteCampaign(token, campaign.id);
      toast.success(t('editor.deleted'));
      router.push('/dashboard');
    } catch {
      toast.error(t('editor.deleteFailed'));
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>{t(`status.${campaign.status}` as TranslationKey)}</Badge>

      {pendingPublish ? <Badge variant="outline">{t('editor.pendingPublish')}</Badge> : null}

      <span className="text-xs text-muted-foreground">
        {saving ? t('common.saving') : savedAt ? `${t('common.savedAt')} ${savedAt.toLocaleTimeString()}` : ''}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={remove} disabled={busy} aria-label={t('editor.deleteAria')}>
          <Trash2 className="size-4" />
        </Button>

        {campaign.status === 'ACTIVE' ? (
          <>
            <Button type="button" variant="outline" onClick={() => run('pause')} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Pause className="size-4" />}
              {t('editor.pause')}
            </Button>
            <Button type="button" onClick={() => run('publish')} disabled={busy || saving}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              {t('editor.republish')}
            </Button>
          </>
        ) : (
          <Button type="button" onClick={() => run('publish')} disabled={busy || saving}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            {t('editor.publish')}
          </Button>
        )}
      </div>
    </div>
  );
}
