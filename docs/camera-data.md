# Camera data model

Camera cards are driven by the `Camera` records in `data/mock-data.ts`. Add,
remove, or reorder records in the `cameras` array without changing the dashboard
or card component.

## Fields

| Field | Purpose |
| --- | --- |
| `id` | Stable internal key. |
| `code` | Operator-facing camera identifier. It does not depend on array order. |
| `name`, `location` | Human-readable placement details. |
| `status`, `signal` | Connectivity state displayed by the card. |
| `recording` | Controls whether the recording indicator is shown. |
| `stream` | Feed label, resolution, and color/infrared mode. |
| `feed` | Decorative focal point, detection zone, and activity region. |
| `lastDetected`, `confidence`, `timestamp` | Most recent detection summary. |

## Adding a camera

1. Add a complete `Camera` object to the `cameras` array.
2. Give `id` and `code` unique, stable values.
3. Choose feed layout classes from Tailwind's existing positioning and sizing
   utilities. Keep complete class names in the data record so Tailwind can detect
   and include them at build time.
4. Run `npm run build` to validate the record and generated styles.

In production, the same shape can be returned by a camera API. Runtime validation
should be added at that boundary before untrusted JSON is passed to the UI.
