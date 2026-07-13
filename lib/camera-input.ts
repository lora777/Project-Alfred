import type { CameraConfigurationInput } from "@/data/mock-data";

export type CameraInputResult =
  | { ok: true; data: CameraConfigurationInput }
  | { ok: false; error: string };

export function parseCameraConfigurationInput(value: unknown): CameraInputResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Request body must be a camera configuration object" };
  }

  const input = value as Record<string, unknown>;

  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    return { ok: false, error: "Camera name is required" };
  }

  if (input.name.trim().length > 60) {
    return { ok: false, error: "Camera name must be 60 characters or fewer" };
  }

  if (typeof input.location !== "string" || input.location.trim().length === 0) {
    return { ok: false, error: "Camera location is required" };
  }

  if (input.location.trim().length > 100) {
    return { ok: false, error: "Camera location must be 100 characters or fewer" };
  }

  if (typeof input.code !== "string") {
    return { ok: false, error: "Camera code is required" };
  }

  const code = input.code.trim().toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(code)) {
    return {
      ok: false,
      error: "Camera code must contain 2-20 letters, numbers, or hyphens",
    };
  }

  if (input.status !== "online" && input.status !== "offline") {
    return { ok: false, error: "Camera status must be online or offline" };
  }

  if (
    typeof input.qualityLabel !== "string" ||
    input.qualityLabel.trim().length === 0 ||
    input.qualityLabel.trim().length > 40
  ) {
    return { ok: false, error: "Quality label must contain 1-40 characters" };
  }

  if (typeof input.recording !== "boolean") {
    return { ok: false, error: "Recording must be true or false" };
  }

  return {
    ok: true,
    data: {
      name: input.name.trim(),
      location: input.location.trim(),
      code,
      status: input.status,
      qualityLabel: input.qualityLabel.trim(),
      recording: input.recording,
    },
  };
}
