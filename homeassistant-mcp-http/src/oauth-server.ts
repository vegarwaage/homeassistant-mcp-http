// ABOUTME: OAuth 2.1 Authorization Server for MCP with PKCE support
// ABOUTME: Implements token endpoint, client registration, and PKCE validation

import { randomBytes, createHash } from 'crypto';

// In-memory storage (in production, use Redis or database)
interface AuthorizationCode {
  code: string;
  client_id: string;
  code_challenge: string;
  code_challenge_method: string;
  redirect_uri: string;
  created_at: number;
  ha_code: string; // The authorization code from Home Assistant
}

interface RegisteredClient {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  created_at: number;
}

interface AccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  ha_access_token: string; // The actual HA access token
  created_at: number;
}

const authorizationCodes = new Map<string, AuthorizationCode>();
const registeredClients = new Map<string, RegisteredClient>();
const accessTokens = new Map<string, AccessToken>();

// Cleanup expired data every 5 minutes
setInterval(() => {
  const now = Date.now();

  // Remove expired authorization codes (10 minutes)
  for (const [code, data] of authorizationCodes.entries()) {
    if (now - data.created_at > 10 * 60 * 1000) {
      authorizationCodes.delete(code);
    }
  }

  // Remove expired access tokens (based on expires_in)
  for (const [token, data] of accessTokens.entries()) {
    if (now - data.created_at > data.expires_in * 1000) {
      accessTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

/**
 * Register a new OAuth client (Dynamic Client Registration - RFC 7591)
 */
export function registerClient(redirectUris: string[]): RegisteredClient {
  const client_id = randomBytes(16).toString('hex');
  const client_secret = randomBytes(32).toString('hex');

  const client: RegisteredClient = {
    client_id,
    client_secret,
    redirect_uris: redirectUris,
    created_at: Date.now()
  };

  registeredClients.set(client_id, client);

  return client;
}

/**
 * Get a registered client
 */
export function getClient(client_id: string): RegisteredClient | undefined {
  return registeredClients.get(client_id);
}

/**
 * Store authorization code with PKCE challenge
 */
export function storeAuthorizationCode(params: {
  client_id: string;
  code_challenge: string;
  code_challenge_method: string;
  redirect_uri: string;
  ha_code: string;
}): string {
  const code = randomBytes(32).toString('hex');

  authorizationCodes.set(code, {
    code,
    ...params,
    created_at: Date.now()
  });

  return code;
}

/**
 * Verify PKCE code verifier against stored challenge
 */
function verifyPKCE(code_verifier: string, code_challenge: string, method: string): boolean {
  if (method === 'S256') {
    const hash = createHash('sha256').update(code_verifier).digest('base64url');
    return hash === code_challenge;
  } else if (method === 'plain') {
    return code_verifier === code_challenge;
  }
  return false;
}

/**
 * Exchange authorization code for access token (with PKCE validation)
 */
export function exchangeAuthorizationCode(params: {
  code: string;
  code_verifier: string;
  client_id: string;
  redirect_uri: string;
}): { access_token: string; token_type: string; expires_in: number } | null {
  const authCode = authorizationCodes.get(params.code);

  if (!authCode) {
    console.error('Authorization code not found');
    return null;
  }

  // Check if code is expired (10 minutes)
  if (Date.now() - authCode.created_at > 10 * 60 * 1000) {
    authorizationCodes.delete(params.code);
    console.error('Authorization code expired');
    return null;
  }

  // Verify client_id
  if (authCode.client_id !== params.client_id) {
    console.error('Client ID mismatch');
    return null;
  }

  // Verify redirect_uri
  if (authCode.redirect_uri !== params.redirect_uri) {
    console.error('Redirect URI mismatch');
    return null;
  }

  // Verify PKCE code verifier
  if (!verifyPKCE(params.code_verifier, authCode.code_challenge, authCode.code_challenge_method)) {
    console.error('PKCE verification failed');
    return null;
  }

  // Delete the authorization code (one-time use)
  authorizationCodes.delete(params.code);

  // Generate access token
  const access_token = randomBytes(32).toString('hex');
  const expires_in = 3600; // 1 hour

  accessTokens.set(access_token, {
    access_token,
    token_type: 'Bearer',
    expires_in,
    ha_access_token: authCode.ha_code, // Store the HA code for later exchange
    created_at: Date.now()
  });

  return {
    access_token,
    token_type: 'Bearer',
    expires_in
  };
}

/**
 * Validate access token and get associated HA token
 */
export function validateAccessToken(access_token: string): string | null {
  const tokenData = accessTokens.get(access_token);

  if (!tokenData) {
    return null;
  }

  // Check if token is expired
  if (Date.now() - tokenData.created_at > tokenData.expires_in * 1000) {
    accessTokens.delete(access_token);
    return null;
  }

  return tokenData.ha_access_token;
}

/**
 * Revoke access token
 */
export function revokeAccessToken(access_token: string): boolean {
  return accessTokens.delete(access_token);
}
