"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraIcon, CameraOff, LoaderCircle, RefreshCw, Square, X } from "lucide-react";
import type { Camera } from "@/data/mock-data";
import { Button } from "@/components/ui/button";

type ConnectionState = "idle" | "connecting" | "live" | "error";

export type BrowserCameraStream = {
  stream: MediaStream;
  deviceId: string;
};

export function BrowserCameraModal({
  cameras,
  initialCameraId,
  activeStreams,
  onConnected,
  onDisconnected,
  onClose,
}: {
  cameras: Camera[];
  initialCameraId?: string;
  activeStreams: Record<string, BrowserCameraStream>;
  onConnected: (cameraId: string, connection: BrowserCameraStream) => void;
  onDisconnected: (cameraId: string) => void;
  onClose: () => void;
}) {
  const defaultCameraId =
    initialCameraId ||
    cameras.find((camera) => camera.status === "offline")?.id ||
    cameras[0]?.id ||
    "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedCameraId, setSelectedCameraId] = useState(defaultCameraId);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    activeStreams[defaultCameraId] ? "live" : "idle",
  );
  const [error, setError] = useState("");

  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId);
  const activeConnection = activeStreams[selectedCameraId];

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const available = (await navigator.mediaDevices.enumerateDevices()).filter(
      (device) => device.kind === "videoinput",
    );
    setDevices(available);
    return available;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = activeConnection?.stream ?? null;
    if (activeConnection) {
      setDeviceId(activeConnection.deviceId);
      setConnectionState("live");
      void video.play();
    } else {
      const savedDeviceId = localStorage.getItem(
        `alfred-browser-camera-${selectedCameraId}`,
      );
      setDeviceId(savedDeviceId || "");
      setConnectionState("idle");
    }
    setError("");
  }, [activeConnection, selectedCameraId]);

  useEffect(() => {
    void refreshDevices();
    const handleDeviceChange = () => void refreshDevices();
    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [refreshDevices]);

  const connect = useCallback(
    async (requestedDeviceId?: string) => {
      if (!selectedCameraId) {
        setError("Choose a camera card before connecting a video source.");
        setConnectionState("error");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access requires a modern browser on localhost or HTTPS.");
        setConnectionState("error");
        return;
      }

      setConnectionState("connecting");
      setError("");

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
        const activeDeviceId =
          stream.getVideoTracks()[0]?.getSettings().deviceId || selectedDeviceId;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setDeviceId(activeDeviceId);
        localStorage.setItem(
          `alfred-browser-camera-${selectedCameraId}`,
          activeDeviceId,
        );
        onConnected(selectedCameraId, { stream, deviceId: activeDeviceId });
        await refreshDevices();
        setConnectionState("live");
      } catch (reason) {
        const name = reason instanceof DOMException ? reason.name : "CameraError";
        setError(
          name === "NotAllowedError"
            ? "Camera permission was blocked. Allow it in the browser address bar, then retry."
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "That camera is unavailable. Check Camo or choose another device."
              : "The camera could not start. It may already be in use by another app.",
        );
        setConnectionState("error");
      }
    },
    [deviceId, onConnected, refreshDevices, selectedCameraId],
  );

  const disconnect = () => {
    onDisconnected(selectedCameraId);
    if (videoRef.current) videoRef.current.srcObject = null;
    setConnectionState("idle");
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
              {selectedCamera ? `Connect ${selectedCamera.name}` : "Connect iPhone or webcam"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Choose the destination card and the camera device exposed by macOS.
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
                  <CameraIcon className="h-9 w-9 text-zinc-600" strokeWidth={1.25} />
                )}
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    {connectionState === "connecting"
                      ? "Connecting camera…"
                      : connectionState === "error"
                        ? "Camera unavailable"
                        : "Ready for a video source"}
                  </p>
                  <p className={`mt-1 text-xs leading-5 ${connectionState === "error" ? "text-red-300/80" : "text-zinc-500"}`}>
                    {error || "Your Mac camera and iPhone camera are both valid sources."}
                  </p>
                </div>
                <Button type="button" onClick={() => void connect()} disabled={connectionState === "connecting" || !selectedCameraId}>
                  {connectionState === "error" ? <RefreshCw className="mr-2 h-4 w-4" /> : <CameraIcon className="mr-2 h-4 w-4" />}
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

        <footer className="grid gap-3 border-t border-zinc-800 px-5 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
            Camera card
            <select
              value={selectedCameraId}
              onChange={(event) => setSelectedCameraId(event.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs normal-case tracking-normal text-zinc-200 outline-none focus:border-zinc-500"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>{camera.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
            Video source
            <select
              value={deviceId}
              onChange={(event) => {
                setDeviceId(event.target.value);
                if (connectionState === "live") void connect(event.target.value);
              }}
              disabled={devices.length === 0}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs normal-case tracking-normal text-zinc-200 outline-none focus:border-zinc-500 disabled:opacity-50"
            >
              {devices.length === 0 && <option value="">No cameras detected yet</option>}
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          {connectionState === "live" && (
            <Button type="button" variant="outline" onClick={disconnect}>
              <Square className="mr-2 h-3.5 w-3.5" /> Stop
            </Button>
          )}
        </footer>
      </section>
    </div>
  );
}
