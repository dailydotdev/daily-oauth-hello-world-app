import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookieNames, getConfig } from '@/lib/config';
import { errorUrl, type ErrorCode } from '@/lib/errors';
import { requestToken, setTokenCookies } from '@/lib/oauth';

const redirectWithError = (appUrl: string, code: ErrorCode): NextResponse =>
  NextResponse.redirect(errorUrl(appUrl, code));

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const config = getConfig();
  const params = request.nextUrl.searchParams;
  const error = params.get('error');

  if (error) {
    console.error(
      'Authorization failed',
      error,
      params.get('error_description'),
    );
    return redirectWithError(
      config.appUrl,
      error === 'access_denied' ? 'access_denied' : 'authorization_failed',
    );
  }

  const code = params.get('code');
  const state = params.get('state');
  const expectedState = request.cookies.get(cookieNames.state)?.value;
  const verifier = request.cookies.get(cookieNames.verifier)?.value;

  if (!code || !state || state !== expectedState || !verifier) {
    return redirectWithError(config.appUrl, 'invalid_state');
  }

  try {
    const tokens = await requestToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      code_verifier: verifier,
    });

    const response = NextResponse.redirect(config.appUrl);
    setTokenCookies(response, tokens);
    response.cookies.delete(cookieNames.state);
    response.cookies.delete(cookieNames.verifier);
    return response;
  } catch (err) {
    console.error('Token exchange failed', err);
    return redirectWithError(config.appUrl, 'token_exchange_failed');
  }
};
