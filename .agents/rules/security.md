# Submodule Security & Egress Rules

1. **Self-Governed Outbound Traffic**:
   - The central platform is strictly **AIR-GAPPED** (`internal: true`).
   - Forge Apps manage their own egress on the `forge-apps-net` Docker network.
   - Any external API keys (Stripe, Twilio, LLM providers) must be stored in local `.env` and NEVER committed to Git.
2. **Zero-Trust RBAC**:
   - Validate clearance using `authGuard(req, options)` on protected routes.
3. **Multi-Tenant Scoping**:
   - Filter all records by tenant/user clearance.
