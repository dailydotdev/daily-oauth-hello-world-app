# daily.dev Hello world

Your daily.dev, through the public API. A small Next.js App Router app, running on [vinext](https://github.com/cloudflare/vinext) and Cloudflare Workers, that signs people in with daily.dev (OAuth 2.1, authorization code + PKCE, confidential client) and shows their profile, personalized feed and latest bookmarks using the OAuth access token.

It's meant to be forked. Everything an app needs to talk to daily.dev on a user's behalf is here, in about 300 lines:

- `app/api/auth/login` builds the authorize URL with PKCE and `state`
- `app/api/auth/callback` exchanges the code for tokens on the server and stores them in httpOnly cookies
- `app/api/auth/refresh` rotates the refresh token (also used automatically when the access token expires)
- `app/api/auth/logout` clears the session
- `app/page.tsx` calls `/public/v1/profile`, `/public/v1/feeds/foryou` and `/public/v1/bookmarks` as the signed-in user

## Run it locally

1. Create an OAuth app at [daily.dev → Settings → API → OAuth apps](https://daily.dev/settings/api#oauth-apps) with this redirect URI:
   `http://localhost:3005/api/auth/callback`
2. `cp .env.example .env.local` and fill in `DAILY_CLIENT_ID` and `DAILY_CLIENT_SECRET`.
3. `pnpm install && pnpm run dev`, then open http://localhost:3005.

## Deploy to Cloudflare Workers

1. Sign in with `pnpm exec cf auth login`, or set `CLOUDFLARE_API_TOKEN` (the **Edit Cloudflare Workers** template) in CI.
2. Set `CLOUDFLARE_ACCOUNT_ID`, or add `accountId` at the top level of `cloudflare.config.ts`.
3. Set the secrets declared in `cloudflare.config.ts` with `pnpm exec cf workers secrets update`: `DAILY_CLIENT_ID`, `DAILY_CLIENT_SECRET` and `APP_URL`. `DAILY_API_URL`, `DAILY_RESOURCE` and `DAILY_SCOPES` are optional.
4. Add `<APP_URL>/api/auth/callback` to your OAuth app's redirect URIs on daily.dev.
5. `pnpm run deploy`.

## Make it yours

- `DAILY_SCOPES` asks for `read` by default. Add `write` if your app bookmarks posts or changes feed settings on the user's behalf; the consent screen lets people decline it.
- `DAILY_RESOURCE` is `https://api.daily.dev/public/v1` for the REST API. Use `https://api.daily.dev/mcp` if your app talks to the daily.dev MCP server instead; tokens only work for the resource they were issued for.
- Every endpoint is listed in the [OpenAPI spec](https://api.daily.dev/public/v1/docs/json). Add a `fetchWithToken` call in `app/page.tsx` and you're done.
- Requests run as the signed-in user and count against their API quota (200 requests per 30 days on free accounts, more on Plus). Cache what you can.
- When you're ready, list your app in the [daily.dev marketplace](https://daily.dev/marketplace) so other developers can find it.

## Security notes

- The client secret never leaves the server. Keep it out of `NEXT_PUBLIC_*` variables and client bundles.
- Tokens live in httpOnly, `SameSite=Lax` cookies, `Secure` in production.
- Refresh tokens expire and rotate on every use. The app stores the newest one from each response and sends people back through sign-in when a refresh fails.
- People can revoke access any time from daily.dev → Settings → API → Connected apps.

Docs: [OAuth apps](https://docs.daily.dev/oauth-apps/) · [Public API](https://docs.daily.dev/public-api/) · [Plugin marketplace](https://docs.daily.dev/plugin-marketplace/)
