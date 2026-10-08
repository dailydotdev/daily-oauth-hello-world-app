const errorMessages = {
  access_denied: 'You declined access on daily.dev.',
  authorization_failed: 'daily.dev could not complete the sign-in. Try again.',
  invalid_state:
    'The sign-in link expired or was opened in another tab. Try again.',
  token_exchange_failed: 'Signing in with daily.dev failed. Try again.',
  session_expired: 'Your session expired. Sign in again.',
  refresh_failed: 'Your session could not be refreshed. Sign in again.',
} as const;

export type ErrorCode = keyof typeof errorMessages;

export const errorMessage = (code?: string): string | null => {
  if (!code) {
    return null;
  }
  return Object.hasOwn(errorMessages, code)
    ? errorMessages[code as ErrorCode]
    : 'Something went wrong. Try again.';
};

export const errorUrl = (appUrl: string, code: ErrorCode): string =>
  `${appUrl}/?error=${code}`;
