import { createHash, randomBytes } from 'node:crypto';
import type { NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { cookieNames, getConfig } from './config';

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

const base64Url = (buffer: Buffer): string => buffer.toString('base64url');

export const createPkce = () => {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
};

export const createState = (): string => base64Url(randomBytes(16));

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export const requestToken = async (
  params: Record<string, string>,
): Promise<TokenResponse> => {
  const config = getConfig();
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      resource: config.resource,
      ...params,
    }),
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      `Token request failed (${res.status}): ${JSON.stringify(body)}`,
    );
  }

  return body as TokenResponse;
};

export const setTokenCookies = (
  response: NextResponse,
  tokens: TokenResponse,
): void => {
  response.cookies.set(cookieNames.accessToken, tokens.access_token, cookieOptions);
  if (tokens.refresh_token) {
    response.cookies.set(
      cookieNames.refreshToken,
      tokens.refresh_token,
      cookieOptions,
    );
  }
  if (tokens.id_token) {
    response.cookies.set(cookieNames.idToken, tokens.id_token, cookieOptions);
  }
  if (tokens.expires_in) {
    response.cookies.set(
      cookieNames.expiresAt,
      String(Date.now() + tokens.expires_in * 1000),
      cookieOptions,
    );
  }
};

export const setTempCookie = (
  response: NextResponse,
  name: string,
  value: string,
): void => {
  response.cookies.set(name, value, { ...cookieOptions, maxAge: 600 });
};

export const clearAllCookies = (response: NextResponse): void => {
  Object.values(cookieNames).forEach((name) => response.cookies.delete(name));
};

export type IdTokenVerification =
  | { ok: true; alg: string; claims: Record<string, unknown> }
  | { ok: false; error: string };

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

export const verifyIdToken = async (
  idToken?: string,
): Promise<IdTokenVerification | null> => {
  if (!idToken) {
    return null;
  }

  const config = getConfig();
  jwks ??= createRemoteJWKSet(new URL(config.jwksUrl));

  try {
    const { payload, protectedHeader } = await jwtVerify(idToken, jwks, {
      issuer: config.issuer,
      audience: config.clientId,
    });
    return { ok: true, alg: protectedHeader.alg, claims: payload };
  } catch (err) {
    return {
      ok: false,
      error: `${(err as Error).name}: ${(err as Error).message}`,
    };
  }
};

export const decodeJwtPayload = (
  token?: string,
): Record<string, unknown> | null => {
  const payload = token?.split('.')[1];
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};
