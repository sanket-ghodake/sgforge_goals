## Description
Briefly describe the change and its architectural intent within this microservice.

## Scope
- [ ] Business Logic / Server Handlers (`src/server.ts`, `src/`)
- [ ] Database Schema / Turso Client (`src/db/`)
- [ ] Micro-SDK / Astryx UI Component (`src/lib/`)
- [ ] 5-Tier Tests (`test/unit/`, `integration/`, `security/`, `contracts/`, `e2e/`)
- [ ] Docker & Deployment (`docker/`, `docker-compose.yml`)
- [ ] Documentation & Specifications (`docs/`, `README.md`)

## 📜 Legal & Contributor Certification (DCO 1.1)
- [ ] **Developer Certificate of Origin (DCO 1.1)**: I certify that this contribution was created in whole or in part by me, and I have the right to submit it under the Apache-2.0 License.
- [ ] **Signed-off-by Trailer**: All commits in this pull request include a valid `Signed-off-by: Author <email>` trailer (`git commit -s`).
- [ ] **Apache License 2.0 Compliance**: I understand that this work is dedicated to the public open-source project under Apache-2.0 with zero proprietary encumbrances.
- [ ] **Zero Corporate Work-for-Hire Bleed**: I confirm that no proprietary employer code, trade secrets, confidential tokens, or employer-specific usernames are present in this contribution.

## ⚡ Quality & Compliance Gate Checklist
- [ ] **Zero Monorepo Bleed**: All code is self-contained with ZERO imports from central monorepo packages.
- [ ] **Strict File Size Cap**: All modified/new files are $\le 500$ lines ($\le 300$ lines ideal).
- [ ] **Astryx Design Tokens**: All UI elements strictly consume Astryx tokens (`--forge-*`) with 100% dark/light theme parity.
- [ ] **Turso DB Scoping**: Operates exclusively on local `data/<app>.db`.
- [ ] **Zero-Trust Security**: No hardcoded credentials, unredacted PII in logs, or exposed stack traces.
- [ ] **18-Check Pre-Commit Gate**: All deterministic checks pass via `./run.sh verify`.
- [ ] **5-Tier Tests**: Unit, integration, security, contract, and e2e tests 100% passing via `./run.sh test`.
