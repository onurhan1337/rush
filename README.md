<div align="center">

# Rush

**Time-limited offer campaigns for ikas storefronts.**

Build a campaign in the ikas Admin panel, hit publish, and Rush does two things at once:
it creates the matching discount campaign through the ikas Admin API,
and it renders a countdown offer panel on the storefront.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-087EA4?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io)
[![License](https://img.shields.io/badge/License-MIT-1E1E1E?style=flat-square)](./LICENSE)

</div>

---

Rush doubles as a reference implementation for ikas app development. OAuth, the Admin GraphQL API, storefront script injection, webhooks and a public event pipeline all live in one codebase, each one small enough to read in a sitting.

## Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [How publishing works](#how-publishing-works)
- [How the storefront widget works](#how-the-storefront-widget-works)
- [Campaign types are pluggable](#campaign-types-are-pluggable)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Working with the ikas Admin API](#working-with-the-ikas-admin-api)
- [Authentication](#authentication)
- [Data](#data)
- [Notes for contributors](#notes-for-contributors)

## What it does

| | |
| --- | --- |
| **Offer campaigns** | Pick products and variants, set an offer price and quantity, write the headline, subtitle and CTA. |
| **Countdown** | A fixed end date shared by every visitor, or a per-session timer that starts the moment a visitor first sees the panel. |
| **Targeting rules** | Cart total, cart contains a product, page type, visitor state (logged in, first visit), or a schedule with date range, weekdays and hours. |
| **Appearance** | Accent, secondary and sale price colors, corner radius, icon, CTA style, mount position (fixed side or a CSS selector), optional auto-open. |
| **Live preview** | A sandbox storefront that renders the widget from the current unsaved form state, with simulated cart, page type and visitor context. |
| **ikas campaign sync** | Publishing writes a real ikas discount campaign, so the offer price is enforced at checkout and not just in the UI. |
| **Analytics** | Impressions, opens, clicks, add-to-carts, dismisses and revenue, aggregated daily per campaign and shown as a funnel. |
| **Script management** | Install, update and remove the storefront script per storefront, with version tracking. |
| **Uninstall cleanup** | An ikas webhook removes synced campaigns, neutralizes the script and drops stored tokens when the app is uninstalled. |

## Architecture

Rush has three surfaces that share one set of types.

**Admin app** &mdash; `src/app`, `src/components`

Next.js App Router pages loaded inside the ikas Admin iframe. The browser never talks to ikas directly. It obtains a short-lived JWT from the ikas App Bridge and calls this app's own API routes.

**Server API** &mdash; `src/app/api`

Two groups of routes. `/api/ikas/*` requires the JWT, resolves the merchant's stored OAuth token and calls the ikas Admin GraphQL API. `/api/public/*` is unauthenticated and serves the storefront: campaign config keyed by a per-merchant public key, plus an event collector.

**Storefront widget** &mdash; `src/widget`

A dependency-free TypeScript bundle compiled by esbuild to `public/rush.js`. It renders inside a shadow root so merchant CSS cannot leak in, reads cart state from the ikas storefront event bus, evaluates targeting rules on the client, and posts events back in batches.

```
                 ikas Admin panel                      Merchant storefront
                        |                                      |
                   [ iframe ]                            [ rush.js ]
                        |                                      |
                    JWT auth                              public key
                        |                                      |
              /api/ikas/*  ------.               .------  /api/public/*
                                  \             /
                                   [ Next.js server ]
                                    /            \
                       ikas Admin GraphQL      Prisma / SQLite
```

Rule evaluation, appearance types and widget payload types all live in `src/lib/campaigns` and are imported by both the server and the widget bundle. A rule behaves identically wherever it runs.

## How publishing works

```
Draft campaign (SQLite)
        |
        |  validate config against the campaign type's zod schema
        v
   Resolve products and variants from the ikas Admin API
        |
        v
   Create or update ikas discount campaigns for every sales channel
        |
        v
   Ensure the storefront script is installed on every storefront
        |
        v
   Campaign is ACTIVE
```

Pausing reverses the ikas side. Synced campaigns are deleted and the campaign returns to `PAUSED`, so the discount stops applying immediately rather than lingering until the next sync.

## How the storefront widget works

```html
<script src="{deployUrl}/rush.js?v={version}" data-rush-key="{publicKey}" defer></script>
```

```
GET /api/public/config?key=...   ->  active campaigns + resolved products
        |
        v
Evaluate rules against cart, page and visitor context
        |
        v
Render the shadow-DOM panel, sticky tab and countdown
        |
        v
POST /api/public/events          ->  IMPRESSION / OPEN / CLICK / ADD_TO_CART / DISMISS
```

> **On that public key.** It is not a credential. It is derived per merchant as `HMAC-SHA256(authorizedAppId, RUSH_PUBLIC_KEY_SECRET)`, truncated to 32 hex characters. It is only good for reading published campaign config and posting events for campaigns that merchant owns, and event submission is rate limited per key and session.

A cart-dependent rule stays unsatisfied until the cart is actually known, so the widget never flashes a discount it cannot yet justify.

## Campaign types are pluggable

A campaign type is a single object implementing `CampaignTypeDefinition`:

```ts
export interface CampaignTypeDefinition<TConfig> {
  key: string;
  label: string;
  description: string;
  configSchema: ZodType<TConfig>;
  defaultConfig: TConfig;
  supportedRules: RuleKind[];
  toIkasCampaignInput(campaign, config, context): IkasCampaignMapping;
  toWidgetPayload(campaign, config, products): WidgetCampaign | null;
}
```

Register it in `src/lib/campaigns/registry.ts` and the API routes, publish flow and public config endpoint pick it up without further changes.

`offer-product` is the only type shipped today, and it exists as much to be read as to be used.

## Project structure

```
src/
  app/
    api/
      ikas/          Admin-authenticated routes (campaigns, products, stats, script, scope)
      oauth/         Authorize and callback
      public/        Storefront config and event collector
      webhooks/      ikas uninstall handling
    dashboard/       Campaign list, campaign editor, settings
    preview/         Sandbox storefront page for live preview
  components/
    campaign/        Editor form, sections, live preview payload hook, stats funnel
    dashboard/       Campaign list, overview cards, scope banner
    preview/         Preview frame and controls
    ui/              shadcn/ui primitives
  lib/
    campaigns/       Type definitions, registry, rules, appearance, widget payload types
    ikas-client/     GraphQL documents, codegen config, generated client
    i18n/            Turkish and English dictionaries, locale from App Bridge
  models/            Prisma-backed managers (auth token, campaign, events, settings, scripts)
  widget/            Storefront bundle: context, rendering, transport
prisma/              SQLite schema
```

## Getting started

Requires Node 20 or newer, and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm prisma:init
pnpm dev
```

### Environment

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_GRAPH_API_URL` | ikas Admin GraphQL endpoint, e.g. `https://api.myikas.com/api/v2/admin/graphql` |
| `NEXT_PUBLIC_ADMIN_URL` | ikas Admin base URL with a `{storeName}` placeholder |
| `NEXT_PUBLIC_DEPLOY_URL` | Public base URL of this app; the storefront script is served from here |
| `NEXT_PUBLIC_CLIENT_ID` | ikas app client id |
| `CLIENT_SECRET` | ikas app client secret |
| `SECRET_COOKIE_PASSWORD` | Long random string for iron-session |
| `RUSH_PUBLIC_KEY_SECRET` | Random 32-byte hex secret used to derive per-merchant public keys |

> **Local development needs a public URL.** The storefront loads `rush.js` from `NEXT_PUBLIC_DEPLOY_URL`, so point it at a tunnel while developing. The script version hash includes the base URL, which means changing it marks every installed script as out of date and the dashboard offers to reinstall.

### Required OAuth scopes

```
read_orders        write_orders
read_products      read_inventories
write_inventories  write_storefronts
read_campaigns     write_campaigns
```

The dashboard compares granted scopes against this list on load and shows a reauthorization banner if any are missing.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Build the widget bundle, then start Next.js in dev |
| `pnpm dev:widget` | Rebuild the widget bundle on change |
| `pnpm build` | Generate the Prisma client, build the widget, build Next.js |
| `pnpm codegen` | Regenerate GraphQL types from `graphql-requests.ts` |
| `pnpm prisma:init` | Generate the Prisma client and push the schema to the local DB |
| `pnpm prisma:studio` | Inspect the local database |
| `pnpm lint` | Run ESLint |

## Working with the ikas Admin API

GraphQL documents live in exactly one place: `src/lib/ikas-client/graphql-requests.ts`.

Add a document there, run `pnpm codegen`, then call it through the typed client:

```ts
const ikas = getIkas(authToken);
const response = await ikas.queries.getMerchant();
```

There are no inline GraphQL strings anywhere in this codebase, and `getIkas` installs an `onCheckToken` handler that refreshes expired OAuth tokens transparently.

## Authentication

The Admin iframe obtains a JWT via `TokenHelpers.getTokenForIframeApp()` and caches it in `sessionStorage` with expiry validation.

Frontend calls carry `Authorization: JWT <token>`. On the server, `withMerchant` resolves the merchant, loads the stored OAuth token and builds the ikas client for the route.

The OAuth callback validates the authorization code with an `HMAC-SHA256(code, clientSecret)` signature before exchanging it, and optionally validates the `state` parameter for CSRF protection.

OAuth access and refresh tokens stay on the server. They are never returned to the browser and never written to logs.

## Data

Postgres via Prisma. `DATABASE_URL` is the pooled connection the app uses at runtime; `DIRECT_URL` is the unpooled one migrations need, since a connection pooler cannot hold the advisory locks and DDL transactions `prisma migrate` relies on. On Neon the two differ only by the `-pooler` suffix in the host.

Migrations are applied by `prisma migrate deploy` as part of the build.

| Model | Purpose |
| --- | --- |
| `AuthToken` | Per-merchant OAuth tokens |
| `Campaign` | Campaign definition, config, rules, appearance, synced ikas campaign ids |
| `CampaignEvent` | Raw storefront events |
| `CampaignStat` | Daily per-campaign aggregates |
| `StorefrontScript` | Installed script id and version per storefront |
| `MerchantSettings` | Derived public key and default appearance |

## Notes for contributors

TypeScript strict, no `any` in application code. Types come from generated GraphQL wherever they exist.

Business logic belongs in `src/lib`. Components render.

Conventional Commits, for example `feat(campaigns): add per-session countdown`.

## License

[MIT](./LICENSE)
