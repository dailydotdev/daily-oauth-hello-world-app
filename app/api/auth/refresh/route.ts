import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookieNames, getConfig } from '@/lib/config';
import { errorUrl } from '@/lib/errors';
import {
  clearAllCookies,
  isAccessTokenExpiring,
  isSameOrigin,
  requestToken,
  setTokenCookies,
} from '@/lib/oauth';

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
      errorUrl(config.appUrl, 'session_expired'),
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
    console.error('Token refresh failed', err);
    const response = NextResponse.redirect(
      errorUrl(config.appUrl, 'refresh_failed'),
      303,
    );
    clearAllCookies(response);
    return response;
  }
};

export const GET = (request: NextRequest): Promise<NextResponse> => {
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  const expiresAt = Number(
    request.cookies.get(cookieNames.expiresAt)?.value ?? 0,
  );
  if (!isAccessTokenExpiring(expiresAt)) {
    return Promise.resolve(
      NextResponse.redirect(`${getConfig().appUrl}${next}`, 303),
    );
  }
  return refresh(request, next);
};

export const POST = (request: NextRequest): Promise<NextResponse> => {
  if (!isSameOrigin(request)) {
    return Promise.resolve(new NextResponse('Forbidden', { status: 403 }));
  }
  return refresh(request, '/?refreshed=1');
};
