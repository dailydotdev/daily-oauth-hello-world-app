import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { clearAllCookies } from '@/lib/oauth';

export const POST = (): NextResponse => {
  const response = NextResponse.redirect(getConfig().appUrl, 303);
  clearAllCookies(response);
  return response;
};
