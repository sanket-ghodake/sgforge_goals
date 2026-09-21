# LLR-AUTH-006: Client-Side Fetch Interceptor & Silent Session Renewal

> **Low-Level Requirement (LLR)** | Status: `VERIFIED` | Traceability ID: `[LLR-AUTH-006]`

---

## 1. Specification
The Single Page Application client runtime and HTTP server shall support transparent token auto-renewal when an access token expires:
1. Intercept HTTP 401 Unauthorized responses from protected endpoints in `window.fetch`.
2. Execute a single-flight `POST /api/auth/refresh` request passing the `forge_refresh_token` cookie.
3. Automatically replay the original request with the newly issued `forge_session` cookie upon successful renewal.
4. Broadcast logout across tabs and redirect to `/auth/login` only when the refresh token is revoked or expired.

## 2. API Contract: `POST /api/auth/refresh`

### Request
- **Headers**: `Cookie: forge_refresh_token=<token>` (or JSON body: `{ "refreshToken": "<token>" }`)
- **Credentials**: `same-origin`

### Success Response (200 OK)
```json
{
  "status": "SUCCESS",
  "accessToken": "eyJhbGciOiJFZERTQSI...",
  "message": "Authentication session renewed successfully"
}
```
- **Response Headers**:
  - `Set-Cookie`: `forge_session=<jwt>; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`
  - `Set-Cookie`: `forge_refresh_token=<rtr>; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`

### Error Response (401 Unauthorized)
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Unauthorized: Refresh Token Missing",
  "status": 401,
  "detail": "No refresh token found in request cookies or payload.",
  "code": "REFRESH_TOKEN_MISSING"
}
```

## 3. Algorithmic Steps
1. In `src/lib/ui-scripts.ts`, initialize `refreshPromise = null`.
2. When any `window.fetch` call completes with `status === 401`:
   - If URL is an auth control endpoint (`/api/auth/refresh`, `/api/auth/login`, `/api/auth/logout`), trigger logout immediately.
   - Otherwise, await `attemptSilentRefresh()`.
   - If `attemptSilentRefresh()` resolves to true, replay original fetch and return result.
   - If `attemptSilentRefresh()` resolves to false, broadcast logout and redirect to `/auth/login`.
3. In `src/server.ts`, intercept `POST /api/auth/refresh` before `authGuard`.
4. In `src/lib/auth-refresh.ts`, extract token, forward to upstream Central Auth or issue autonomous local fallback token with matching claims.

## 4. Traceability Links
- **Parent HLR**: `[HLR-SDK-301]`
- **Implementation**: `src/lib/auth-refresh.ts`, `src/lib/ui-scripts.ts`, `src/server.ts`
- **Verification**:
  - `test/unit/token-refresh.test.ts`
  - `test/integration/auth-refresh.test.ts`
  - `test/security/auth-gate.test.ts`
  - `test/e2e/playwright-journeys.test.ts`
