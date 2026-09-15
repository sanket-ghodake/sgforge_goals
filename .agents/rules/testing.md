# Submodule 5-Tier Testing Standards

All tests must be colocated in `test/`:
- `test/unit/`: Logic & DB operations (Arrange, Act, Assert)
- `test/integration/`: Endpoint request/response verification
- `test/security/`: Auth gate & 401/403 negative assertions
- `test/contracts/`: JSON schema validation
- `test/e2e/`: Real network lifecycle tests
