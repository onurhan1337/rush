'use client';

import { Monitor, Smartphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { PageType } from '@/lib/campaigns/rules/types';
import { useT } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/dictionaries';
import type { PreviewContext } from './preview-frame';

const PAGE_TYPES: Array<{ value: PageType; label: TranslationKey }> = [
  { value: 'home', label: 'page.home' },
  { value: 'product', label: 'page.product' },
  { value: 'collection', label: 'page.collection' },
  { value: 'cart', label: 'page.cart' },
  { value: 'other', label: 'page.other' },
];

type Props = {
  context: PreviewContext;
  onContextChange: (context: PreviewContext) => void;
  device: 'desktop' | 'mobile';
  onDeviceChange: (device: 'desktop' | 'mobile') => void;
};

export function PreviewControls({ context, onContextChange, device, onDeviceChange }: Props) {
  const t = useT();

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-md border p-4">
      <div className="flex gap-1">
        <Button type="button" variant={device === 'desktop' ? 'default' : 'outline'} size="icon" onClick={() => onDeviceChange('desktop')} aria-label={t('preview.desktop')}>
          <Monitor className="size-4" />
        </Button>
        <Button type="button" variant={device === 'mobile' ? 'default' : 'outline'} size="icon" onClick={() => onDeviceChange('mobile')} aria-label={t('preview.mobile')}>
          <Smartphone className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium">{t('preview.cartTotal')}</Label>
        <Input
          type="number"
          min="0"
          className="w-32"
          value={context.cart.total}
          onChange={(event) => onContextChange({ ...context, cart: { ...context.cart, total: Number(event.target.value) || 0 } })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium">{t('preview.pageType')}</Label>
        <Select value={context.pageType} onValueChange={(value) => onContextChange({ ...context, pageType: value as PageType })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_TYPES.map((pageType) => (
              <SelectItem key={pageType.value} value={pageType.value}>
                {t(pageType.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <Switch id="preview-login" checked={context.isLoggedIn} onCheckedChange={(checked) => onContextChange({ ...context, isLoggedIn: checked })} />
        <Label htmlFor="preview-login" className="text-xs font-normal">
          {t('preview.loggedIn')}
        </Label>
      </div>
    </div>
  );
}
