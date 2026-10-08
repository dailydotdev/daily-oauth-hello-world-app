import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookieNames, getConfig } from '@/lib/config';
import { clearAllCookies, isSameOrigin, revokeRefreshToken } from '@/lib/oauth';

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  if (!isSameOrigin(request)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const refreshToken = request.cookies.get(cookieNames.refreshToken)?.value;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  const response = NextResponse.redirect(getConfig().appUrl, 303);
  clearAllCookies(response);
  return response;
};
