import type { Camera } from "@/data/mock-data";

export function getCameraConnectionLabel(camera: Camera) {
  if (camera.status === "offline") return "Offline";
  if (camera.signalStrength >= 70) return "Good connection";
  if (camera.signalStrength >= 40) return "Weak connection";

  return "Poor connection";
}
