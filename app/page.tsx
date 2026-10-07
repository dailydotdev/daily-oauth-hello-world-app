import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cookieNames, getConfig } from '@/lib/config';
import { decodeJwtPayload, verifyIdToken } from '@/lib/oauth';

type Profile = {
  id: string;
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
  permalink?: string;
  reputation?: number;
  isPlus?: boolean;
  createdAt?: string;
  experienceLevel?: string;
  streak?: { current: number; max: number; total: number } | null;
};

type Post = {
  id: string;
  title: string;
  url?: string | null;
  commentsPermalink?: string;
  summary?: string | null;
  readTime?: number | null;
  numUpvotes: number;
  numComments: number;
  tags?: string[];
  source?: { name: string; handle?: string } | null;
  bookmarkedAt?: string;
};

type Page<T> = { data: T[] };

type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; body: string };

const fetchWithToken = async <T,>(
  url: string,
  accessToken: string,
): Promise<ApiResult<T>> => {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const text = await res.text();

    if (!res.ok) {
      return { ok: false, status: res.status, body: text };
    }

    return { ok: true, data: JSON.parse(text) as T };
  } catch (err) {
    return { ok: false, status: 0, body: (err as Error).message };
  }
};

const formatJson = (value: unknown): string => JSON.stringify(value, null, 2);

const ApiError = ({ result }: { result: { status: number; body: string } }) => (
  <div className="error">
    {result.status || 'Network error'}: {result.body}
  </div>
);

const PostList = ({ posts }: { posts: Post[] }) =>
  posts.length === 0 ? (
    <p className="muted">Nothing here yet.</p>
  ) : (
    <ul className="list">
      {posts.map((post) => (
        <li key={post.id} className="post">
          <a href={post.commentsPermalink ?? post.url ?? '#'} target="_blank">
            {post.title}
          </a>
          <div className="muted">
            {post.source?.name && <span>{post.source.name}</span>}
            {post.readTime ? <span>{post.readTime} min read</span> : null}
            <span>{post.numUpvotes} upvotes</span>
            <span>{post.numComments} comments</span>
          </div>
        </li>
      ))}
    </ul>
  );

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) => {
  const { error, refreshed } = await searchParams;
  const config = getConfig();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(cookieNames.accessToken)?.value;
  const idToken = cookieStore.get(cookieNames.idToken)?.value;
  const hasRefreshToken = !!cookieStore.get(cookieNames.refreshToken)?.value;
  const expiresAt = Number(cookieStore.get(cookieNames.expiresAt)?.value ?? 0);

  if (!accessToken) {
    return (
      <main>
        <header>
          <h1>daily.dev Hello world</h1>
          <p className="muted">
            Your daily.dev, through the public API. Sign in to see your profile,
            feed and bookmarks. You want to build apps on top of daily.dev?
            Take a look at the docs and source code below.
          </p>
          <p className="links">
            <a href="https://docs.daily.dev/plugin-marketplace/">Plugin marketplace docs</a>
            <a href="https://docs.daily.dev/public-api/">Public API docs</a>
            <a href="https://github.com/dailydotdev/daily-oauth-hello-world-app">Source on GitHub</a>
          </p>
        </header>
        {error && <div className="error">{error}</div>}
        <a className="signin" href="/api/auth/login">
          <img src="/sign-in-with-daily-dev.png" alt="Sign in with daily.dev" />
        </a>
        <div className="card">
          <h2>How it works</h2>
          <ol className="steps">
            <li>
              You sign in with daily.dev and approve read access on the consent
              screen. No API token to copy.
            </li>
            <li>
              This app exchanges the code for tokens on the server (OAuth 2.1,
              PKCE, confidential client) and keeps them in httpOnly cookies.
            </li>
            <li>
              Every page load calls the public API as you:{' '}
              <code>/profile</code>, <code>/feeds/foryou</code> and{' '}
              <code>/bookmarks</code>.
            </li>
          </ol>
          <p className="muted">
            Disconnect any time from daily.dev → Settings → API → Connected apps.
          </p>
        </div>
        <details className="card">
          <summary>OAuth configuration</summary>
          <pre>
            {formatJson({
              clientId: config.clientId,
              redirectUri: config.redirectUri,
              scopes: config.scopes,
              resource: config.resource,
              authorizeUrl: config.authorizeUrl,
              tokenUrl: config.tokenUrl,
            })}
          </pre>
        </details>
      </main>
    );
  }

  if (hasRefreshToken && expiresAt && expiresAt - 30_000 < Date.now()) {
    redirect('/api/auth/refresh?next=/');
  }

  const [profile, feed, bookmarks, userinfo, idTokenVerification] =
    await Promise.all([
      fetchWithToken<Profile>(config.profileUrl, accessToken),
      fetchWithToken<Page<Post>>(config.feedUrl, accessToken),
      fetchWithToken<Page<Post>>(config.bookmarksUrl, accessToken),
      fetchWithToken<Record<string, unknown>>(config.userinfoUrl, accessToken),
      verifyIdToken(idToken),
    ]);
  const accessClaims = decodeJwtPayload(accessToken);
  const idClaims = decodeJwtPayload(idToken);
  const expiresInSeconds = expiresAt
    ? Math.round((expiresAt - Date.now()) / 1000)
    : null;

  return (
    <main>
      <header>
        <h1>daily.dev Hello world</h1>
        <p className="muted">Signed in with daily.dev. Everything below comes from the public API.</p>
        <p className="links">
          <a href="https://docs.daily.dev/plugin-marketplace/">Plugin marketplace docs</a>
          <a href="https://docs.daily.dev/public-api/">Public API docs</a>
          <a href="https://github.com/dailydotdev/daily-oauth-hello-world-app">Source on GitHub</a>
        </p>
      </header>
      {error && <div className="error">{error}</div>}
      {refreshed && <div className="success">Tokens refreshed</div>}

      <div className="card">
        <h2>Profile</h2>
        {profile.ok ? (
          <>
            <div className="profile">
              {profile.data.image && (
                <img className="avatar" src={profile.data.image} alt="" />
              )}
              <div>
                <div>
                  <strong>{profile.data.name}</strong>
                  {profile.data.isPlus && <span className="badge">Plus</span>}
                </div>
                <div className="muted">
                  {profile.data.permalink ? (
                    <a href={profile.data.permalink} target="_blank">
                      @{profile.data.username}
                    </a>
                  ) : (
                    `@${profile.data.username}`
                  )}
                </div>
                {profile.data.bio && <p>{profile.data.bio}</p>}
              </div>
            </div>
            <div className="stats">
              <div>
                <strong>{profile.data.reputation ?? 0}</strong>
                Reputation
              </div>
              {profile.data.streak && (
                <>
                  <div>
                    <strong>{profile.data.streak.current}</strong>
                    Current streak
                  </div>
                  <div>
                    <strong>{profile.data.streak.max}</strong>
                    Longest streak
                  </div>
                </>
              )}
              {profile.data.experienceLevel && (
                <div>
                  <strong>{profile.data.experienceLevel}</strong>
                  Experience
                </div>
              )}
            </div>
          </>
        ) : (
          <ApiError result={profile} />
        )}
      </div>

      <div className="card">
        <h2>Your feed</h2>
        {feed.ok ? <PostList posts={feed.data.data} /> : <ApiError result={feed} />}
      </div>

      <div className="card">
        <h2>Latest bookmarks</h2>
        {bookmarks.ok ? (
          <PostList posts={bookmarks.data.data} />
        ) : (
          <ApiError result={bookmarks} />
        )}
      </div>

      <details className="card">
        <summary>Developer details</summary>
        <h3>Userinfo (GET /auth/oauth2/userinfo)</h3>
        {userinfo.ok ? <pre>{formatJson(userinfo.data)}</pre> : <ApiError result={userinfo} />}
        <h3>ID token verification (jose, JWKS)</h3>
        {!idTokenVerification ? (
          <p className="muted">No ID token</p>
        ) : idTokenVerification.ok ? (
          <>
            <div className="success">
              Signature, issuer, audience and expiry verified (
              {idTokenVerification.alg})
            </div>
            <pre>{formatJson(idTokenVerification.claims)}</pre>
          </>
        ) : (
          <div className="error">{idTokenVerification.error}</div>
        )}
        <h3>Tokens</h3>
        <p className="muted">
          {expiresInSeconds === null
            ? 'Unknown access token expiry'
            : expiresInSeconds > 0
              ? `Access token expires in ${expiresInSeconds}s`
              : `Access token expired ${-expiresInSeconds}s ago`}
          {' · '}
          {hasRefreshToken ? 'Refresh token present' : 'No refresh token'}
        </p>
        <pre>{formatJson({ accessToken: accessClaims, idToken: idClaims })}</pre>
      </details>

      <div className="actions">
        <form action="/api/auth/refresh" method="post">
          <button type="submit" disabled={!hasRefreshToken}>
            Refresh tokens
          </button>
        </form>
        <form action="/api/auth/logout" method="post">
          <button type="submit">Log out</button>
        </form>
      </div>
    </main>
  );
};

export default Page;
