# Project Alfred documentation

Project Alfred is a local-first residential perimeter monitoring dashboard. The
current application uses typed mock data so the UI can be developed independently
of a camera service.

## Guides

- [Camera data model](./camera-data.md) explains how camera cards are configured.

## Project structure

- `app/` contains the Next.js app shell and dashboard page.
- `components/` contains dashboard and reusable UI components.
- `data/` contains typed mock records that stand in for an API response.
- `lib/` contains shared utilities.

The dashboard is rendered from the exports in `data/mock-data.ts`. UI components
should receive records as props and avoid deriving camera identity or capability
from array position.
