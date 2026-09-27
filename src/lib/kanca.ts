import { createKanca } from '@kanca/ikas';

/**
 * Kanca observability: webhook deliveries, Admin API calls and installs.
 * Only metadata is sent (scope, status, duration, error code); without
 * KANCA_KEY this is a silent no-op.
 */
export const kanca = createKanca({
  key: process.env.KANCA_KEY,
  endpoint: process.env.KANCA_ENDPOINT,
});
