# Goals Micro-App - Container Architecture

This directory organizes container configurations into development and production sub-environments:

- [`dev/`](file:///home/sanket/Desktop/Sanket/org_website_clone/forge-apps/goals/docker/dev): Watch-mode development container with hot-reload and volume mounting.
- [`prod/`](file:///home/sanket/Desktop/Sanket/org_website_clone/forge-apps/goals/docker/prod): Production multi-stage Alpine image with AOT bundle minification.

## Healthcheck Invariants
All Dockerfiles enforce `HEALTHCHECK` probing against `/health` (HTTP 200 OK) on port `8090`.
