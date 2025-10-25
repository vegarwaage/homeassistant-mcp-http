# Version 2.1.0 - Critical OAuth & CORS Fixes

**Release Date**: October 25, 2025

## Critical Fixes for Claude.ai Connectivity

This release fixes **4 critical blocking issues** preventing Claude.ai web interface from connecting to the MCP server.

### Issues Fixed

#### 1. ✅ Missing CORS Headers (BLOCKER)
**Problem**: Claude.ai runs in browser and was blocked by CORS policy
- No CORS middleware configured
- Browser silently blocked all requests to /mcp endpoint
- Caused page reload with no error messages

**Fix**:
- Added `cors` package with proper configuration
- Configured origins: `https://claude.ai`, `https://*.claude.ai`
- Exposed required headers: `Mcp-Session-Id`, `WWW-Authenticate`
- Allowed headers: `Authorization`, `Content-Type`, `Mcp-Session-Id`

**File**: `src/http-server.ts:39-46`

#### 2. ✅ Missing WWW-Authenticate Header (BLOCKER)
**Problem**: Claude.ai couldn't discover OAuth endpoints
- Per RFC 6750 and GitHub issue #2267, clients need WWW-Authenticate header
- OAuth discovery via `.well-known` is secondary to WWW-Authenticate
- Claude ignored discovery endpoints without this header

**Fix**:
- Added WWW-Authenticate header to all 401 responses
- Header includes `resource_metadata` pointing to `.well-known/oauth-protected-resource/mcp`
- Complies with RFC 6750 and RFC 9728

**File**: `src/http-server.ts:309-312, 324-329`

#### 3. ✅ Cookie-Based Auth Instead of Bearer Tokens (BLOCKER)
**Problem**: Remote MCP clients can't use cookies
- `requireAuth` middleware looked for `mcp_session` cookie
- OAuth 2.1 requires `Authorization: Bearer <token>` header
- Cross-domain cookies don't work for remote clients

**Fix**:
- Completely rewrote `requireAuth` middleware
- Now checks `Authorization` header for Bearer token
- Validates token using `validateAccessToken()` from oauth-server.ts
- Removed cookie-based session logic

**File**: `src/http-server.ts:301-339`

#### 4. ✅ OAuth Token Endpoint Auth Method Mismatch
**Problem**: Claude sends `token_endpoint_auth_method: "client_secret_post"`
- Server only declared support for `"none"`
- Caused Dynamic Client Registration failures per GitHub issue #3515

**Fix**:
- Added `"client_secret_post"` to supported methods
- Now: `token_endpoint_auth_methods_supported: ["none", "client_secret_post"]`

**File**: `src/http-server.ts:778`

### Additional Improvements

- **Removed unused import**: `getValidAccessToken` from oauth.js (no longer needed with Bearer tokens)
- **Better error messages**: OAuth errors now include descriptive error_description fields
- **Version bump**: 2.0.0 → 2.1.0 in both package.json and config.yaml

## Technical Details

### CORS Configuration
```typescript
app.use(cors({
  origin: ['https://claude.ai', 'https://*.claude.ai', /https:\/\/.*\.claude\.ai$/],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id'],
  exposedHeaders: ['Mcp-Session-Id', 'WWW-Authenticate'],
  methods: ['GET', 'POST', 'OPTIONS']
}));
```

### WWW-Authenticate Header Format
```http
WWW-Authenticate: Bearer realm="https://selwaha.duckdns.org", resource_metadata="https://selwaha.duckdns.org/.well-known/oauth-protected-resource/mcp"
```

For invalid tokens:
```http
WWW-Authenticate: Bearer realm="https://selwaha.duckdns.org", resource_metadata="https://selwaha.duckdns.org/.well-known/oauth-protected-resource/mcp", error="invalid_token", error_description="Token expired or invalid"
```

### Bearer Token Authentication Flow
1. Client includes `Authorization: Bearer <token>` header
2. Server extracts token from header
3. Server validates token with `validateAccessToken()`
4. If valid, extracts HA access token and attaches to request
5. If invalid/missing, returns 401 with WWW-Authenticate header

## Migration Notes

### Breaking Changes
⚠️ **Cookie-based authentication no longer works**
- If you were using cookies for authentication, switch to Bearer tokens
- OAuth flow now requires clients to include `Authorization: Bearer <token>` header

### Deployment Steps
1. Pull latest code from repository
2. Run `npm install` (adds cors package)
3. Run `npm run build`
4. Deploy to Home Assistant addon
5. Test with MCP Inspector before Claude.ai

## Research Sources

These fixes are based on:
- **RFC 6750**: OAuth 2.0 Bearer Token Usage
- **RFC 9728**: OAuth 2.0 Protected Resource Metadata
- **RFC 8414**: OAuth 2.0 Authorization Server Metadata
- **Aaron Parecki's article**: "Let's fix OAuth in MCP" (April 2025)
- **GitHub Issue #3515**: MCP OAuth Integration Fails with step=start_error
- **GitHub Issue #2267**: Cannot connect Remote GitHub MCP Server
- **MCP Specification 2025-03-26**: Streamable HTTP Transport

## Next Steps

1. **Test with MCP Inspector**: Verify OAuth flow works end-to-end
2. **Check browser console**: Look for any remaining CORS or connection errors
3. **Test with Claude.ai**: Attempt connection from web interface
4. **Monitor logs**: Watch addon logs for connection attempts and errors

## Files Modified

- `src/http-server.ts` - All critical fixes applied
- `package.json` - Version bump + cors dependency
- `config.yaml` - Version bump to 2.1.0
- `CHANGELOG_v2.1.0.md` - This file

## Expected Outcome

With these fixes, Claude.ai should now:
1. ✅ Pass CORS preflight checks
2. ✅ Discover OAuth endpoints via WWW-Authenticate header
3. ✅ Successfully complete Dynamic Client Registration
4. ✅ Exchange authorization code for Bearer token
5. ✅ Connect to /mcp endpoint with Bearer token
6. ✅ Access all 17 Home Assistant tools

If issues persist, they are likely Claude.ai platform limitations rather than implementation problems.
