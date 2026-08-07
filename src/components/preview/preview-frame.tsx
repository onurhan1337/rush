'use client';

import { useEffect, useRef } from 'react';
import type { WidgetConfigPayload } from '@/lib/campaigns/widget-types';
import type { PageType } from '@/lib/campaigns/rules/types';
import { useT } from '@/lib/i18n';

export type PreviewContext = {
  cart: { total: number; lines: Array<{ productId?: string; variantId?: string; quantity: number; price: number }> };
  pageType: PageType;
  isLoggedIn: boolean;
  isFirstVisit: boolean;
};

type Props = {
  payload: WidgetConfigPayload;
  context: PreviewContext;
  device: 'desktop' | 'mobile';
};

export function PreviewFrame({ payload, context, device }: Props) {
  const t = useT();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const latestRef = useRef({ payload, context });

  latestRef.current = { payload, context };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'rush:preview-ready') return;
      readyRef.current = true;
      frameRef.current?.contentWindow?.postMessage(
        { type: 'rush:preview', payload: { ...latestRef.current.payload, context: latestRef.current.context } },
        '*',
      );
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    const timer = setTimeout(() => {
      frameRef.current?.contentWindow?.postMessage({ type: 'rush:preview', payload: { ...payload, context } }, '*');
    }, 150);
    return () => clearTimeout(timer);
  }, [payload, context]);

  return (
    <div className="flex justify-center">
      <iframe
        ref={frameRef}
        src="/preview"
        title={t('preview.frameTitle')}
        sandbox="allow-scripts"
        onLoad={() => {
          frameRef.current?.contentWindow?.postMessage({ type: 'rush:preview', payload: { ...payload, context } }, '*');
        }}
        className="h-[560px] rounded-lg border bg-white transition-[width]"
        style={{ width: device === 'mobile' ? 390 : '100%' }}
      />
    </div>
  );
}
