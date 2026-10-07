import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookieNames, getConfig } from '@/lib/config';
import { requestToken, setTokenCookies } from '@/lib/oauth';

const redirectWithError = (appUrl: string, message: string): NextResponse =>
  NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(message)}`);

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const config = getConfig();
  const params = request.nextUrl.searchParams;
  const error = params.get('error');

  if (error) {
    return redirectWithError(
      config.appUrl,
      `${error}${params.get('error_description') ? `: ${params.get('error_description')}` : ''}`,
    );
  }

  const code = params.get('code');
  const state = params.get('state');
  const expectedState = request.cookies.get(cookieNames.state)?.value;
  const verifier = request.cookies.get(cookieNames.verifier)?.value;

  if (!code || !state || state !== expectedState || !verifier) {
    return redirectWithError(config.appUrl, 'Invalid state or missing code');
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
    return redirectWithError(config.appUrl, (err as Error).message);
  }
};
