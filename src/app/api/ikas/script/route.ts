import { NextResponse } from 'next/server';
import { ensureSettings, withMerchant } from '@/lib/api-route-helpers';
import { getPublicBaseUrl } from '@/lib/public-url';
import { getScriptStatus, installScript, uninstallScript, type ScriptStatus } from '@/lib/storefront-script';

export type ScriptStatusApiResponse = { statuses: ScriptStatus[]; publicKey: string; baseUrl: string };

export const GET = withMerchant(async (request, context) => {
  const baseUrl = getPublicBaseUrl(request);
  const settings = await ensureSettings(context);
  const statuses = await getScriptStatus(context.ikas, context.authorizedAppId, baseUrl);
  return NextResponse.json({ data: { statuses, publicKey: settings.publicKey, baseUrl } });
});

export const POST = withMerchant(async (request, context) => {
  const baseUrl = getPublicBaseUrl(request);
  const settings = await ensureSettings(context);
  const statuses = await installScript(context.ikas, context.authorizedAppId, settings.publicKey, baseUrl);
  return NextResponse.json({ data: { statuses, publicKey: settings.publicKey, baseUrl } });
});

export const DELETE = withMerchant(async (request, context) => {
  const baseUrl = getPublicBaseUrl(request);
  await uninstallScript(context.ikas, context.authorizedAppId);
  const settings = await ensureSettings(context);
  const statuses = await getScriptStatus(context.ikas, context.authorizedAppId, baseUrl);
  return NextResponse.json({ data: { statuses, publicKey: settings.publicKey, baseUrl } });
});
