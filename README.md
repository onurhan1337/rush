# Rush

Rush is an ikas app that lets merchants run time-limited offer campaigns on their storefront. A merchant builds a campaign in the ikas Admin panel, publishes it, and Rush takes care of two things at once: it creates the matching discount campaign through the ikas Admin API, and it renders a countdown offer panel on the storefront through an injected script.

It is built as a reference implementation for ikas app development, covering OAuth, the Admin GraphQL API, storefront script injection, webhooks, and a public event pipeline in one codebase.

## What it does

- **Offer campaigns** — pick products and variants, set an offer price and quantity, and give the campaign a headline, subtitle and CTA.
- **Countdown** — either a fixed end date shared by all visitors, or a per-session timer that starts when a visitor first sees the panel.
- **Targeting rules** — show the panel only when conditions match: cart total, cart contains a product, page type, visitor state (logged in, first visit), or a schedule (date range, days of week, hours).
- **Appearance** — accent, secondary and sale price colors, corner radius, icon, CTA style, mount position (fixed side or a CSS selector on the page), and optional auto-open.
- **Live preview** — a sandbox storefront page that renders the widget with the current, unsaved form state and lets you simulate cart, page type and visitor context.
- **ikas campaign sync** — publishing writes a real ikas discount campaign so the offer price is enforced at checkout, not just in the UI.
- **Analytics** — impressions, opens, clicks, add-to-carts, dismisses and revenue, aggregated daily per campaign and shown as a funnel.
- **Storefront script management** — install, update and remove the widget script per storefront, with version tracking so a changed deploy URL marks scripts as out of date.
- **Uninstall cleanup** — an ikas webhook removes synced campaigns, neutralizes the storefront script and drops stored tokens when the app is uninstalled.

## Architecture

Rush has three surfaces that share one set of types.

**Admin app** (`src/app`, `src/components`) — Next.js App Router pages loaded inside the ikas Admin iframe. The browser never talks to ikas directly; it obtains a short-lived JWT from the ikas App Bridge and calls this app's own API routes.

**Server API** (`src/app/api`) — two groups of routes. `/api/ikas/*` requires the JWT, resolves the merchant's stored OAuth token and calls the ikas Admin GraphQL API. `/api/public/*` is unauthenticated and serves the storefront: campaign config keyed by a per-merchant public key, and an event collector.

**Storefront widget** (`src/widget`) — a dependency-free TypeScript bundle compiled by esbuild to `public/rush.js`. It renders inside a shadow root so merchant CSS cannot leak in, reads cart state from the ikas storefront event bus, evaluates targeting rules on the client, and posts events back in batches.

Rule evaluation, appearance types and widget payload types live in `src/lib/campaigns` and are imported by both the server and the widget bundle, so a rule behaves identically wherever it runs.

### Campaign publish flow

```
Draft campaign (SQLite)
  -> validate config against the campaign type's zod schema
  -> resolve products and variants from the ikas Admin API
  -> create/update ikas discount campaigns for every sales channel
  -> ensure the storefront script is installed on every storefront
  -> mark campaign ACTIVE
```

Pausing reverses the ikas side: synced campaigns are deleted and the campaign returns to `PAUSED`, so the discount stops applying immediately.

### Storefront request flow

```
<script src="{deployUrl}/rush.js?v={version}" data-rush-key="{publicKey}" defer>
  -> GET /api/public/config?key=...   -> active campaigns + resolved products
  -> evaluate rules against cart/page/visitor context
  -> render shadow-DOM panel, sticky tab, countdown
  -> POST /api/public/events          -> IMPRESSION / OPEN / CLICK / ADD_TO_CART / DISMISS
```

The public key is not stored as a credential. It is derived per merchant with `HMAC-SHA256(authorizedAppId, RUSH_PUBLIC_KEY_SECRET)`, truncated to 32 hex characters, and is only good for reading published campaign config and posting events for campaigns that merchant owns. Event submission is rate limited per key and session.

### Campaign types are pluggable

A campaign type is a single object implementing `CampaignTypeDefinition`: a zod config schema, a default config, the rule kinds it supports, a mapping to ikas campaign input, and a mapping to the widget payload. Registering a new type means adding it to `src/lib/campaigns/registry.ts`; the API routes, publish flow and public config endpoint pick it up without changes. `offer-product` is the only type shipped today and serves as the worked example.

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

Requires Node 20+ and pnpm.

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

Local development needs a public URL, since the storefront loads `rush.js` from `NEXT_PUBLIC_DEPLOY_URL`. Point it at a tunnel while developing. The script version hash includes the base URL, so changing it marks every installed script as out of date and the dashboard offers to reinstall.

### Required OAuth scopes

`read_orders`, `write_orders`, `read_products`, `read_inventories`, `write_inventories`, `write_storefronts`, `read_campaigns`, `write_campaigns`.

The dashboard checks granted scopes against this list on load and shows a reauthorization banner if any are missing.

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

GraphQL documents live in one place: `src/lib/ikas-client/graphql-requests.ts`. Add a document there, run `pnpm codegen`, then call it through the typed client.

```ts
const ikas = getIkas(authToken);
const response = await ikas.queries.getMerchant();
```

Inline GraphQL strings in routes or components are not used anywhere in this codebase, and `getIkas` installs an `onCheckToken` handler that refreshes expired OAuth tokens transparently.

## Authentication

- The Admin iframe obtains a JWT via `TokenHelpers.getTokenForIframeApp()` and caches it in `sessionStorage` with expiry validation.
- Frontend calls carry `Authorization: JWT <token>`; `withMerchant` resolves the merchant, loads the stored OAuth token and builds the ikas client for the route.
- The OAuth callback validates the authorization code with an `HMAC-SHA256(code, clientSecret)` signature before exchanging it, and optionally validates the `state` parameter for CSRF protection.
- OAuth access and refresh tokens stay on the server. They are never returned to the browser or written to logs.

## Data

SQLite via Prisma, suitable for development and small deployments. Point the datasource at Postgres for production.

| Model | Purpose |
| --- | --- |
| `AuthToken` | Per-merchant OAuth tokens |
| `Campaign` | Campaign definition, config, rules, appearance, synced ikas campaign ids |
| `CampaignEvent` | Raw storefront events |
| `CampaignStat` | Daily per-campaign aggregates |
| `StorefrontScript` | Installed script id and version per storefront |
| `MerchantSettings` | Derived public key and default appearance |

## Notes for contributors

- TypeScript strict, no `any` in application code; types come from generated GraphQL where available.
- Business logic belongs in `src/lib`; components render.
- Conventional Commits, for example `feat(campaigns): add per-session countdown`.

## License

MIT
