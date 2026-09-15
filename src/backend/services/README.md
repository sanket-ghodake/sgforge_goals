# Goals Micro-App - Services Directory (`src/backend/services/`)

Houses core business service conductors:

- `board-service.ts`: Manages Goal Board CRUD operations, milestone weight validation (100% sum rule), and transactional lock invariants.
- `review-service.ts`: Handles manager review workflows, rework requests with revision incrementing, and approval sealing.
- `reminder-service.ts`: Manages user action alerts and reminder notifications.
