"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, LoaderCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConnectionState = "idle" | "connecting" | "live" | "error";

export function BrowserCameraModal({
  cameraId,
  cameraName,
  onClose,
}: {
  cameraId?: string;
  cameraName?: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [error, setError] = useState("");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const cameras = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind === "videoinput",
    );
    setDevices(cameras);
    return cameras;
  }, []);

  const connect = useCallback(
    async (requestedDeviceId?: string) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access requires a modern browser on localhost or HTTPS.");
        setConnectionState("error");
        return;
      }

      setConnectionState("connecting");
      setError("");
      stopStream();

      try {
        const selectedDeviceId = requestedDeviceId || deviceId;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: selectedDeviceId
            ? {
                deviceId: { exact: selectedDeviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const activeDeviceId =
          stream.getVideoTracks()[0]?.getSettings().deviceId || selectedDeviceId;
        setDeviceId(activeDeviceId);
        localStorage.setItem(
          cameraId ? `alfred-browser-camera-${cameraId}` : "alfred-browser-camera",
          activeDeviceId,
        );
        await refreshDevices();
        setConnectionState("live");
      } catch (reason) {
        const name = reason instanceof DOMException ? reason.name : "CameraError";
        const message =
          name === "NotAllowedError"
            ? "Camera permission was blocked. Allow it in the browser address bar, then retry."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "That camera is unavailable. Check Camo and choose another device."
              : "The camera could not start. It may already be in use by another app.";
        setError(message);
        setConnectionState("error");
      }
    },
    [cameraId, deviceId, refreshDevices, stopStream],
  );

  useEffect(() => {
    setDeviceId(
      localStorage.getItem(
        cameraId ? `alfred-browser-camera-${cameraId}` : "alfred-browser-camera",
      ) || "",
    );
    void refreshDevices();

    const handleDeviceChange = () => void refreshDevices();
    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
      stopStream();
    };
  }, [cameraId, refreshDevices, stopStream]);

  const selectDevice = (nextDeviceId: string) => {
    setDeviceId(nextDeviceId);
    if (connectionState === "live") void connect(nextDeviceId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="browser-camera-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <header className="flex items-start justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-red-500">
              Local video source
            </p>
            <h2 id="browser-camera-title" className="mt-1 text-lg font-semibold text-zinc-100">
              {cameraName ? `Reconnect ${cameraName}` : "Connect iPhone or webcam"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Start Camo on the iPhone and PC, then select Camo Camera below.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close camera connection" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="relative aspect-video bg-[#080909]">
          <video
            ref={videoRef}
            className={`h-full w-full object-cover transition-opacity ${connectionState === "live" ? "opacity-100" : "opacity-0"}`}
            autoPlay
            muted
            playsInline
          />

          {connectionState !== "live" && (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(63,63,70,0.2),transparent_44%)] px-6 text-center">
              <div className="flex max-w-md flex-col items-center gap-4">
                {connectionState === "connecting" ? (
                  <LoaderCircle className="h-9 w-9 animate-spin text-zinc-500" />
                ) : connectionState === "error" ? (
                  <CameraOff className="h-9 w-9 text-red-400" />
                ) : (
                  <Camera className="h-9 w-9 text-zinc-600" strokeWidth={1.25} />
                )}
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    {connectionState === "connecting"
                      ? "Connecting camera…"
                      : connectionState === "error"
                        ? "Camera unavailable"
                        : "Ready for your iPhone"}
                  </p>
                  <p className={`mt-1 text-xs leading-5 ${connectionState === "error" ? "text-red-300/80" : "text-zinc-500"}`}>
                    {error || "Connect the phone through Camo, then allow browser camera access."}
                  </p>
                </div>
                <Button type="button" onClick={() => void connect()} disabled={connectionState === "connecting"}>
                  {connectionState === "error" ? <RefreshCw className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                  {connectionState === "error" ? "Retry" : "Connect camera"}
                </Button>
              </div>
            </div>
          )}

          {connectionState === "live" && (
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-100 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_7px_#ef4444]" /> Live
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-600">
            Camera names appear after browser permission is granted.
          </p>
          <select
            aria-label="Camera source"
            value={deviceId}
            onChange={(event) => selectDevice(event.target.value)}
            disabled={devices.length === 0}
            className="min-w-64 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-zinc-500 disabled:opacity-50"
          >
            {devices.length === 0 && <option value="">No cameras detected yet</option>}
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </footer>
      </section>
    </div>
  );
}
