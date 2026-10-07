import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookieNames, getConfig } from '@/lib/config';
import { clearAllCookies, requestToken, setTokenCookies } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

const safeNext = (value: string | null): string =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/';

const refresh = async (
  request: NextRequest,
  successUrl: string,
): Promise<NextResponse> => {
  const config = getConfig();
  const refreshToken = request.cookies.get(cookieNames.refreshToken)?.value;

  if (!refreshToken) {
    const response = NextResponse.redirect(
      `${config.appUrl}/?error=${encodeURIComponent('Your session expired, sign in again')}`,
      303,
    );
    clearAllCookies(response);
    return response;
  }

  try {
    const tokens = await requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    const response = NextResponse.redirect(`${config.appUrl}${successUrl}`, 303);
    setTokenCookies(response, tokens);
    return response;
  } catch (err) {
    const response = NextResponse.redirect(
      `${config.appUrl}/?error=${encodeURIComponent((err as Error).message)}`,
      303,
    );
    clearAllCookies(response);
    return response;
  }
};

export const GET = (request: NextRequest): Promise<NextResponse> =>
  refresh(request, safeNext(request.nextUrl.searchParams.get('next')));

export const POST = (request: NextRequest): Promise<NextResponse> =>
  refresh(request, '/?refreshed=1');
