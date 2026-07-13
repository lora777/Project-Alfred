import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import {
  getStoredCamera,
  getStoredCameraSource,
  updateStoredCameraSnapshot,
} from "@/lib/cameras-db";

const maximumSnapshotBytes = 10 * 1024 * 1024;
export const cameraMediaRoot =
  process.env.ALFRED_MEDIA_ROOT ?? join(process.cwd(), "data", "media");

export class CameraSnapshotError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CameraSnapshotError";
  }
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };

    return entities[character];
  });
}

function createSimulatedSnapshot(name: string, location: string) {
  const capturedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <radialGradient id="glow" cx="55%" cy="42%" r="58%">
          <stop offset="0" stop-color="#344039"/>
          <stop offset="1" stop-color="#090b0a"/>
        </radialGradient>
        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M48 0H0V48" fill="none" stroke="#758078" stroke-opacity=".08"/>
        </pattern>
      </defs>
      <rect width="1280" height="720" fill="url(#glow)"/>
      <rect width="1280" height="720" fill="url(#grid)"/>
      <rect x="215" y="155" width="520" height="330" fill="#98a49d" fill-opacity=".03" stroke="#98a49d" stroke-opacity=".22"/>
      <circle cx="910" cy="440" r="145" fill="#98a49d" fill-opacity=".04"/>
      <circle cx="42" cy="42" r="6" fill="#ef4444"/>
      <text x="62" y="48" fill="#a1a1aa" font-family="monospace" font-size="18" letter-spacing="4">SNAPSHOT</text>
      <text x="48" y="642" fill="#e4e4e7" font-family="sans-serif" font-size="34" font-weight="600">${escapeXml(name)}</text>
      <text x="48" y="680" fill="#71717a" font-family="monospace" font-size="17">${escapeXml(location)}  /  ${escapeXml(capturedAt)}</text>
    </svg>
  `;

  return {
    bytes: Buffer.from(svg.trim()),
    mimeType: "image/svg+xml",
  };
}

function detectImageType(bytes: Uint8Array, contentType: string | null) {
  const normalized = contentType?.split(";", 1)[0].trim().toLowerCase();

  if (normalized === "image/jpeg") return { mimeType: normalized, extension: ".jpg" };
  if (normalized === "image/png") return { mimeType: normalized, extension: ".png" };
  if (normalized === "image/webp") return { mimeType: normalized, extension: ".webp" };

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return { mimeType: "image/jpeg", extension: ".jpg" };
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { mimeType: "image/png", extension: ".png" };
  }

  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: ".webp" };
  }

  throw new CameraSnapshotError(
    "Camera did not return a supported JPEG, PNG, or WebP image",
    502,
  );
}

async function fetchHttpSnapshot(sourceUrl: string) {
  const url = new URL(sourceUrl);
  const headers = new Headers({ Accept: "image/jpeg,image/png,image/webp" });

  if (url.username) {
    const credentials = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
    headers.set("Authorization", `Basic ${Buffer.from(credentials).toString("base64")}`);
    url.username = "";
    url.password = "";
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    throw new CameraSnapshotError(`Unable to reach camera: ${message}`, 502);
  }

  if (!response.ok) {
    throw new CameraSnapshotError(
      `Camera returned HTTP ${response.status}`,
      502,
    );
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);

  if (contentLength > maximumSnapshotBytes) {
    throw new CameraSnapshotError("Camera snapshot exceeds the 10 MB limit", 413);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  if (bytes.byteLength === 0) {
    throw new CameraSnapshotError("Camera returned an empty snapshot", 502);
  }

  if (bytes.byteLength > maximumSnapshotBytes) {
    throw new CameraSnapshotError("Camera snapshot exceeds the 10 MB limit", 413);
  }

  return { bytes, ...detectImageType(bytes, response.headers.get("content-type")) };
}

export async function captureCameraSnapshot(id: string) {
  const camera = getStoredCamera(id);
  const source = getStoredCameraSource(id);

  if (!camera || !source) {
    throw new CameraSnapshotError(`Camera ${id} was not found`, 404);
  }

  let captured:
    | { bytes: Uint8Array; mimeType: string; extension: string }
    | { bytes: Uint8Array; mimeType: string };

  if (source.sourceType === "simulated") {
    captured = createSimulatedSnapshot(camera.name, camera.location);
  } else {
    if (!source.sourceUrl) {
      throw new CameraSnapshotError("Camera snapshot source is not configured", 400);
    }

    captured = await fetchHttpSnapshot(source.sourceUrl);
  }

  const extension = "extension" in captured ? captured.extension : ".svg";
  const relativePath = join("cameras", id, `latest${extension}`);
  const filePath = join(cameraMediaRoot, relativePath);
  const temporaryPath = join(dirname(filePath), `.${randomUUID()}.tmp`);

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(temporaryPath, captured.bytes);
  await rm(filePath, { force: true });
  await rename(temporaryPath, filePath);

  const capturedAt = new Date().toISOString();
  updateStoredCameraSnapshot(id, {
    filePath: relativePath,
    mimeType: captured.mimeType,
    capturedAt,
  });

  return {
    capturedAt,
    mimeType: captured.mimeType,
    sizeBytes: captured.bytes.byteLength,
    snapshotUrl: `/api/cameras/${encodeURIComponent(id)}/snapshot/latest`,
  };
}
