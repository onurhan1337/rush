'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewControls } from '@/components/preview/preview-controls';
import { PreviewFrame, type PreviewContext } from '@/components/preview/preview-frame';
import { ApiRequests } from '@/lib/api-requests';
import type { ResolvedProduct } from '@/lib/campaigns/product';
import { useT } from '@/lib/i18n';
import type { Campaign } from '@/models/campaign';
import { CampaignActions } from './campaign-actions';
import { useCampaignForm } from './hooks/use-campaign-form';
import { usePreviewPayload } from './hooks/use-preview-payload';
import { AppearanceSection } from './sections/appearance-section';
import { BasicsSection } from './sections/basics-section';
import { ContentSection } from './sections/content-section';
import { CountdownSection } from './sections/countdown-section';
import { PricingSection } from './sections/pricing-section';
import { ProductSection } from './sections/product-section';
import { RulesSection } from './sections/rules-section';
import { ValidationSummary } from './validation-summary';

const INITIAL_CONTEXT: PreviewContext = {
  cart: { total: 0, lines: [] },
  pageType: 'home',
  isLoggedIn: false,
  isFirstVisit: true,
};

export function CampaignForm({ campaign: initialCampaign, token }: { campaign: Campaign; token: string }) {
  const t = useT();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [products, setProducts] = useState<Record<string, ResolvedProduct>>({});
  const [context, setContext] = useState(INITIAL_CONTEXT);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const { form, saving, savedAt } = useCampaignForm(campaign, token);
  const values = form.watch();
  const payload = usePreviewPayload(campaign, values, products);

  const registerProduct = useCallback((product: ResolvedProduct) => {
    setProducts((current) => (current[product.id] ? current : { ...current, [product.id]: product }));
  }, []);

  const missingIds = (values.config?.items ?? [])
    .map((item) => item.productId)
    .filter((id) => id && !products[id])
    .join(',');

  useEffect(() => {
    if (!missingIds) return;

    let cancelled = false;
    Promise.all(missingIds.split(',').map((id) => ApiRequests.ikas.searchProducts(token, { id })))
      .then((responses) => {
        if (cancelled) return;
        const loaded = responses.map((response) => response.data?.data?.products?.[0]).filter((item): item is ResolvedProduct => !!item);
        if (loaded.length) setProducts((current) => ({ ...current, ...Object.fromEntries(loaded.map((item) => [item.id, item])) }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [missingIds, token]);

  const [showIssues, setShowIssues] = useState(false);

  const validateBeforePublish = useCallback(async () => {
    const valid = await form.trigger();
    setShowIssues(!valid);
    return valid;
  }, [form]);

  return (
    <div className="mx-auto max-w-[1400px] p-8">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" aria-label={t('editor.backAria')}>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-medium tracking-tight">{values.name || t('editor.fallbackName')}</h1>
      </div>

      <div className="mb-6">
        <CampaignActions
          campaign={campaign}
          token={token}
          saving={saving}
          savedAt={savedAt}
          onBeforePublish={validateBeforePublish}
          onCampaignChange={setCampaign}
        />
      </div>

      {showIssues ? <ValidationSummary errors={form.formState.errors} /> : null}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form className="flex flex-col" onSubmit={(event) => event.preventDefault()}>
          <BasicsSection form={form} />
          <ProductSection form={form} token={token} products={products} onProductLoaded={registerProduct} />
          <PricingSection form={form} products={products} />
          <CountdownSection form={form} />
          <ContentSection form={form} />
          <AppearanceSection form={form} />
          <RulesSection form={form} campaignType={campaign.type} />
        </form>

        <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
          <PreviewControls context={context} onContextChange={setContext} device={device} onDeviceChange={setDevice} />
          <PreviewFrame payload={payload} context={context} device={device} />
          {!Object.keys(products).length ? <p className="text-center text-xs text-muted-foreground">{t('preview.selectProduct')}</p> : null}
        </div>
      </div>
    </div>
  );
}
