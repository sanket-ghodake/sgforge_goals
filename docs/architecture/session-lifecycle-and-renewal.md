# Session Lifecycle, Sliding Renewal & Silent Auto-Refresh Architecture

> **Standard**: SG Forge Zero-Trust Authentication Architecture (2026 LTS)  
> **Traceability**: `[HLR-SDK-301]`, `[LLR-AUTH-006]`, `[HLR-AUTH-101]`  
> **Status**: Living Architectural Specification (LTS)

---

## 1. Architectural Overview & Design Philosophy

The **Individual Goal Center (`@forge-apps/goals`)** operates under strict enterprise Zero-Trust invariants while providing a zero-disruption developer and employee experience.

Authentication in the SG Forge platform utilizes a **dual-tier token topology**:
1. **Access Token (`forge_session`)**: A short-lived, cryptographically signed JSON Web Token (`Ed25519` / `HMAC-SHA256`) with a 15-minute default validity window. It carries the employee's verified claims (identity, department, leadership roles) and is verified statelessly by micro-apps via the internal SDK (`verifySessionToken`).
2. **Refresh Token (`forge_refresh_token`)**: A high-entropy, cryptographically hashed token persisted in the Central Auth session store with a 7-day sliding inactivity limit and hard absolute session ceiling.

When an employee's access token expires mid-workflow, the Goal Center SPA runtime executes **Silent Auto-Renewal**: transparently negotiating a fresh session without interrupting the user, flashing loading overlays, or bouncing to `/auth/login`.

---

## 2. Interactive Sequence: Silent Refresh & Request Replay

When one or more API requests return `401 Unauthorized` with `code: "TOKEN_EXPIRED"`:
1. The **Proactive Fetch Interceptor** traps the 401 response before it reaches the view layer.
2. The **Single-Flight Concurrency Lock** ensures that only *one* refresh network request is sent, preventing Refresh Token Rotation (RTR) replay race conditions.
3. Upon receiving renewed session cookies, all enqueued in-flight requests are replayed transparently.

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Employee / Manager
    participant UI as Goal Center SPA (Fetch Interceptor)
    participant Lock as Single-Flight Concurrency Mutex
    participant SubmoduleAPI as Goal Center HTTP Server (/api)
    participant CentralAuth as SG Forge Central Auth (:8080/auth)

    Employee->>UI: Interacts with Goal Board (Concurrent Actions)
    par Parallel Requests
        UI->>SubmoduleAPI: GET /api/boards (Expired forge_session)
        UI->>SubmoduleAPI: GET /api/auth/me (Expired forge_session)
    end
    SubmoduleAPI-->>UI: 401 Unauthorized (code: "TOKEN_EXPIRED")

    Note over UI,Lock: Interceptor intercepts 401.<br/>Request 1 acquires Lock.<br/>Request 2 joins the existing Promise.
    UI->>SubmoduleAPI: POST /api/auth/refresh (Cookie: forge_refresh_token)
    
    alt Central Auth Upstream Online
        SubmoduleAPI->>CentralAuth: POST /api/v1/auth/refresh (RTR Rotation)
        CentralAuth-->>SubmoduleAPI: 200 OK + Set-Cookie (New forge_session & forge_refresh_token)
    else Standalone / Isolated Test Mode
        SubmoduleAPI-->>SubmoduleAPI: Autonomous Local Ed25519 Renewal
    end
    
    SubmoduleAPI-->>UI: 200 OK (New Session Cookies Stamped)
    Note over UI,Lock: Mutex resolves successfully.<br/>Original requests replayed with fresh session.
    
    par Transparent Request Replay
        UI->>SubmoduleAPI: GET /api/boards (Valid forge_session)
        UI->>SubmoduleAPI: GET /api/auth/me (Valid forge_session)
    end
    SubmoduleAPI-->>UI: 200 OK (Goal Boards Payload)
    SubmoduleAPI-->>UI: 200 OK (User Profile Payload)
    UI-->>Employee: Seamless UI update (zero interruption, zero flash of login screen)
```

---

## 3. Session State Machine & Lifecycle Transitions

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> ActiveSession: Login via Central Portal (/auth/login)
    
    state ActiveSession {
        [*] --> TokenValid: 0 - 15 Minutes
        TokenValid --> AccessExpired: 15+ Minutes Inactivity / Normal Expiry
        AccessExpired --> SilentRefreshing: Triggered by 401 API Call or 30s Heartbeat
        SilentRefreshing --> TokenValid: POST /api/auth/refresh (200 OK, RTR Rotated)
    }

    ActiveSession --> SessionTerminated: Refresh Token Expired (> 7 Days)<br/>OR Absolute Hard Ceiling (> 24h)<br/>OR Explicit Employee Logout

    state SessionTerminated {
        [*] --> BroadcastEvent: forge_auth_channel (LOGOUT)
        BroadcastEvent --> StorageSync: LocalStorage Sync Event
        StorageSync --> ClearSession: Clear sessionStorage
        ClearSession --> RedirectGateway: 302 Redirect to /auth/login
    }

    RedirectGateway --> [*]
```

---

## 4. Multi-Tab Real-Time Synchronization

To prevent state desynchronization across multiple open browser tabs:
- **BroadcastChannel (`forge_auth_channel`)**: Instantly notifies sibling tabs when a session is terminated or explicitly logged out.
- **LocalStorage Sync Listener (`forge_logout_event`)**: Serves as a fallback for browsers or sandboxes where `BroadcastChannel` is restricted.
- **Shared Inactivity Heartbeat**: Active tabs query `/api/auth/me` every 30 seconds (throttled when the tab is in the background via `document.visibilityState === 'visible'`).

```mermaid
graph TD
    subgraph TabA ["Browser Tab 1 (Active User Work)"]
        UI_A["Goal Board Editor"]
        Interceptor_A["Fetch Interceptor & Mutex"]
        Heartbeat_A["30s Heartbeat"]
    end

    subgraph TabB ["Browser Tab 2 (Background Monitoring)"]
        UI_B["Team Reviews Drawer"]
        Interceptor_B["Fetch Interceptor"]
        Heartbeat_B["30s Heartbeat"]
    end

    subgraph CrossTabSync ["Cross-Tab Event Fabric"]
        BC["BroadcastChannel ('forge_auth_channel')"]
        LS["localStorage ('forge_logout_event')"]
    end

    subgraph BackendGateway ["Submodule Gateway (/api/auth)"]
        RefreshEndpoint["POST /api/auth/refresh"]
        SessionCheck["GET /api/auth/me"]
    end

    Interceptor_A --> RefreshEndpoint
    Heartbeat_A --> SessionCheck
    Interceptor_B --> RefreshEndpoint
    Heartbeat_B --> SessionCheck

    Interceptor_A -.->|"On Hard Expiry"| BC
    Interceptor_A -.->|"On Hard Expiry"| LS
    BC -.->|"Instant Logout Signal"| Interceptor_B
    LS -.->|"Storage Event Sync"| Interceptor_B
```

---

## 5. Security Invariants & Defense-in-Depth

1. **OWASP ASVS 5.0 Compliance**: Refresh Token Rotation (RTR) ensures that every refresh token is single-use. Replay of an invalidated refresh token triggers family revocation.
2. **Strict Cookie Hygiene**:
   - `forge_session`: `HttpOnly; SameSite=Lax; Path=/; Max-Age=900` (`Secure` in production).
   - `forge_refresh_token`: `HttpOnly; SameSite=Strict; Path=/; Max-Age=604800` (`Secure` in production).
3. **No Infinite Recursion**: The client interceptor explicitly excludes `/api/auth/refresh`, `/api/auth/login`, and `/api/auth/logout` from triggering nested refresh attempts.
4. **Autonomous Submodule Guard**: If Central Auth is offline or executing in an isolated CI container, the Goal Center server maintains deterministic local signing and verification, preventing cascading microservice failures.
