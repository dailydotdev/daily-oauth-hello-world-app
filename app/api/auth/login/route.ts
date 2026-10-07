import { NextResponse } from 'next/server';
import { cookieNames, getConfig } from '@/lib/config';
import { createPkce, createState, setTempCookie } from '@/lib/oauth';

export const dynamic = 'force-dynamic';

export const GET = (): NextResponse => {
  const config = getConfig();
  const { verifier, challenge } = createPkce();
  const state = createState();

  const url = new URL(config.authorizeUrl);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    resource: config.resource,
    prompt: 'consent',
  }).toString();

  const response = NextResponse.redirect(url);
  setTempCookie(response, cookieNames.state, state);
  setTempCookie(response, cookieNames.verifier, verifier);
  return response;
};
