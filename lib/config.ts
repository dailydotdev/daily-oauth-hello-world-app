const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
};

const resolveAppUrl = (): string => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3005';
};

export const getConfig = () => {
  const apiUrl = process.env.DAILY_API_URL ?? 'https://api.daily.dev';
  const appUrl = resolveAppUrl();
  const publicApiUrl = `${apiUrl}/public/v1`;

  return {
    clientId: required('DAILY_CLIENT_ID'),
    clientSecret: required('DAILY_CLIENT_SECRET'),
    apiUrl,
    appUrl,
    publicApiUrl,
    resource: process.env.DAILY_RESOURCE ?? publicApiUrl,
    scopes: process.env.DAILY_SCOPES ?? 'openid profile offline_access read',
    redirectUri: `${appUrl}/api/auth/callback`,
    authorizeUrl: `${apiUrl}/auth/oauth2/authorize`,
    tokenUrl: `${apiUrl}/auth/oauth2/token`,
    revokeUrl: `${apiUrl}/auth/oauth2/revoke`,
    userinfoUrl: `${apiUrl}/auth/oauth2/userinfo`,
    issuer: `${apiUrl}/auth`,
    jwksUrl: `${apiUrl}/auth/jwks`,
    profileUrl: `${publicApiUrl}/profile`,
    feedUrl: `${publicApiUrl}/feeds/foryou?limit=10`,
    bookmarksUrl: `${publicApiUrl}/bookmarks?limit=5`,
  };
};

export const cookieNames = {
  state: 'dd_oauth_state',
  verifier: 'dd_oauth_verifier',
  accessToken: 'dd_access_token',
  refreshToken: 'dd_refresh_token',
  idToken: 'dd_id_token',
  expiresAt: 'dd_expires_at',
};
