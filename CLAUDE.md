

<!-- Source: AGENTS.md -->

# Project Rules for Ikas App Starter App (Next.js)

## Core Principles
- Prefer simplicity, readability, explicitness. Keep logic in small, testable functions.
- TypeScript strict; avoid any. Use precise types from generated GraphQL.
- Treat API tokens and secrets as sensitive; never log them.

## Stack Overview
- Next.js 15 App Router, React 19, TypeScript, Tailwind + shadcn/ui.
- ikas Admin GraphQL via `@ikas/admin-api-client` with codegen.
- Session via `iron-session`.

## MCP Usage
- When generating new UI components, use the "shadcn" MCP to fetch component boilerplates and demos. Align with existing `src/components/ui/*` structure.
- When generating or exploring ikas GraphQL operations, use the "ikas" MCP list and introspect tools to discover available queries/mutations and their shapes before implementation.
  - For ikas GraphQL specifically, follow this order before any implementation:
    1) Use the "ikas" MCP list tool to find the correct query/mutation name.
    2) Use the "ikas" MCP introspect tool to get the operation's full shape (variables, return fields, enums).
    3) Only after confirming via list + introspect, add the document to `graphql-requests.ts` and run codegen.

## GraphQL and API Workflow
- Define queries/mutations in `src/lib/ikas-client/graphql-requests.ts` using `gql`.
- Run `pnpm codegen` to regenerate `src/lib/ikas-client/generated/graphql.ts` types and client wrappers.
- Acquire a client with `getIkas(token)` from `src/helpers/api-helpers.ts`.
- Execute queries via `ikasClient.queries.<name>()` and mutations via `ikasClient.mutations.<name>(variables)`.

## Enforcement
- Do NOT write inline GraphQL strings inside API routes or components.
- Always import documents from `graphql-requests.ts` and run `pnpm codegen` before usage.
- Always call ikas operations through `ikasClient.queries|mutations.<operation>()` to keep type-safety.
- Before adding a new operation, first run the ikas MCP list tool, then introspect to confirm details.

## Adding New API Requests (Procedure)
1) Discover operation via MCP: run ikas list to locate the operation, then ikas introspect to confirm its schema.
2) Add your GraphQL query/mutation to `src/lib/ikas-client/graphql-requests.ts` using the `gql` tag.
3) Run `pnpm codegen` to generate types and update the generated client.
4) Use `getIkas` to create the ikas client inside API routes or server actions.
5) For a query, call `ikasClient.queries.<YourQuery>()`; for a mutation, call `ikasClient.mutations.<YourMutation>(variables)`.

## Project Conventions
- API routes under `src/app/api/*` must validate session and fetch the token via `getUserFromRequest` and `AuthTokenManager`.
- Do not call ikas APIs from the browser; always go through server routes.
- Keep UI logic in components under `src/components/*`; avoid business logic in pages.

## Iframe Pages and Authentication Pattern
When building pages that will be loaded in iframes within the ikas dashboard (e.g., app actions, dashboard widgets):

### Client-Side Pattern (Frontend)
1. **Always call `AppBridgeHelper.closeLoader()`** in a separate `useEffect` with empty dependency array on page mount to close the ikas platform loading indicator.
2. **Always use `TokenHelpers.getTokenForIframeApp()`** to retrieve the JWT authentication token from the ikas app bridge.
3. **Never make direct API calls** to ikas from the frontend. Always go through backend API routes.
4. **Use `ApiRequests` helper** to call backend endpoints with the token.
5. **Follow the dashboard page pattern**: Initialize token on mount, fetch data with token, handle loading/error states.

### Example Pattern:
```typescript
import { TokenHelpers } from '@/helpers/token-helpers';
import { ApiRequests } from '@/lib/api-requests';
import { AppBridgeHelper } from '@ikas/app-helpers';

function MyIframePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (token: string) => {
    const res = await ApiRequests.ikas.getData(token);
    if (res.status === 200 && res.data?.data) {
      setData(res.data.data);
    }
    setLoading(false);
  }, []);

  const initializePage = useCallback(async () => {
    const token = await TokenHelpers.getTokenForIframeApp();
    if (token) {
      await fetchData(token);
    }
  }, [fetchData]);

  // Close the loader shown by ikas platform when opening the iframe
  useEffect(() => {
    AppBridgeHelper.closeLoader();
  }, []);

  useEffect(() => {
    initializePage();
  }, [initializePage]);

  // ... render UI
}
```

### Server-Side Pattern (Backend API)
1. **Create API endpoint under `/api/ikas/*`** for ikas-related operations.
2. **Validate JWT token** using `getUserFromRequest(request)` to extract `authorizedAppId` and `merchantId`.
3. **Fetch OAuth token** from `AuthTokenManager.get(authorizedAppId)`.
4. **Call ikas API** using `getIkas(authToken)` client.
5. **Return data in standard format**: `{ data: { ...yourData } }`.

### Example Pattern:
```typescript
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) return NextResponse.json({ error: 'Auth token not found' }, { status: 404 });

  const ikasClient = getIkas(authToken);
  const response = await ikasClient.queries.someQuery();

  if (response.isSuccess && response.data) {
    return NextResponse.json({ data: { ...response.data } });
  }
  return NextResponse.json({ error: 'Failed' }, { status: 500 });
}
```

### Adding New Iframe Endpoints
1. **Create backend API** in `/api/ikas/<endpoint-name>/route.ts`.
2. **Add to ApiRequests** in `src/lib/api-requests.ts`:
   ```typescript
   yourEndpoint: (token: string, params?) => makeGetRequest<YourResponse>({ url: '/api/ikas/your-endpoint', token, data: params })
   ```
3. **Use in frontend** via `ApiRequests.ikas.yourEndpoint(token, params)`.

### Important Rules
- **ALWAYS** call `AppBridgeHelper.closeLoader()` in a `useEffect(() => { AppBridgeHelper.closeLoader(); }, [])` when the iframe page mounts to close the platform loading indicator.
- **NEVER** bypass the token flow by hardcoding tokens or using environment variables for user authentication.
- **ALWAYS** wrap `useSearchParams()` usage in a `<Suspense>` boundary (Next.js 15 requirement).
- **ALWAYS** follow the established pattern: AppBridgeHelper.closeLoader() → TokenHelpers → ApiRequests → Backend API → ikas Client.
- **ALWAYS** handle loading and error states gracefully in iframe pages.

## Security and Privacy
- Use `onCheckToken` in `getIkas` to auto-refresh tokens. Do not expose tokens in responses or logs.
- TokenHelpers automatically caches tokens in sessionStorage with expiration validation.
- JWT tokens contain `authorizedAppId` (aud) and `merchantId` (sub) for user identification.
- **OAuth Callback Signature Validation**: The OAuth callback endpoint validates authorization codes using HMAC-SHA256 signatures.
  - Use `TokenHelpers.validateCodeSignature(code, signature, clientSecret)` to verify code authenticity.
  - The callback route requires a `signature` query parameter and validates it before exchanging the code for tokens.
  - State parameter validation is optional but recommended for additional CSRF protection.

## Quality Gates
- Run `pnpm codegen` when `graphql-requests.ts` changes.
- Ensure type-safety and linter cleanliness before committing.
- Reject PRs that introduce raw GraphQL usage outside `graphql-requests.ts`.
- Keep naming consistent with `ikas` brand and command patterns.

## Notes
- Prefer `ApiRequests` in `src/lib/api-requests.ts` to bridge frontend to backend endpoints.

## Commit Message Rule
Use **Conventional Commits** format:

- **Format**: `<type>(<scope>): <short summary>`
- **Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- **Scope**: optional, lowercase, represents the module / package / area
- **Summary**: imperative mood, max 72 chars

### Examples
- feat(cart): add discount code validation  
- fix(auth): prevent token refresh loop  
- docs(readme): update installation guide
