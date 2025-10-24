// ABOUTME: Home Assistant OAuth 2.0 implementation
// ABOUTME: Handles authorization flow, token exchange, and refresh

import axios from 'axios';
import { randomBytes } from 'crypto';
import { saveSession, getSession } from './session.js';

const HA_BASE_URL = process.env.HA_BASE_URL || 'http://homeassistant:8123';
const OAUTH_CLIENT_URL = process.env.OAUTH_CLIENT_URL || '';

interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export function generateState(): string {
  return randomBytes(32).toString('hex');
}

export function getAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_URL,
    redirect_uri: `${OAUTH_CLIENT_URL}/oauth/callback`,
    state: state
  });

  return `${HA_BASE_URL}/auth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
  const response = await axios.post(
    `${HA_BASE_URL}/auth/token`,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: OAUTH_CLIENT_URL
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data;
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const response = await axios.post(
    `${HA_BASE_URL}/auth/token`,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: OAUTH_CLIENT_URL
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return response.data;
}

export async function createSession(tokens: OAuthTokenResponse): Promise<string> {
  const sessionId = randomBytes(32).toString('hex');

  const now = Date.now();
  const expiresAt = now + (tokens.expires_in * 1000);

  await saveSession(sessionId, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    created_at: now,
    last_used: now
  });

  return sessionId;
}

export async function getValidAccessToken(sessionId: string): Promise<string | null> {
  const session = await getSession(sessionId);
  if (!session) {
    return null;
  }

  const now = Date.now();

  // If token expires in less than 5 minutes, refresh it
  if (session.expires_at - now < 5 * 60 * 1000) {
    try {
      const tokens = await refreshAccessToken(session.refresh_token);

      await saveSession(sessionId, {
        ...session,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: now + (tokens.expires_in * 1000)
      });

      return tokens.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  return session.access_token;
}
