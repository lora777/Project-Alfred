"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Camera as CameraIcon,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type {
  Camera,
  CameraConfigurationInput,
} from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-red-900";

function suggestCameraCode(cameras: Camera[]) {
  const highest = cameras.reduce((current, camera) => {
    const match = /^CAM-(\d+)$/.exec(camera.code);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);

  return `CAM-${String(highest + 1).padStart(2, "0")}`;
}

function createEmptyForm(cameras: Camera[]): CameraConfigurationInput {
  return {
    name: "",
    location: "",
    code: suggestCameraCode(cameras),
    status: "offline",
    qualityLabel: "1080P / IR",
    recording: false,
    sourceType: "simulated",
    snapshotUrl: "",
  };
}

function cameraToForm(camera: Camera): CameraConfigurationInput {
  return {
    name: camera.name,
    location: camera.location,
    code: camera.code,
    status: camera.status,
    qualityLabel: camera.qualityLabel,
    recording: camera.recording,
    sourceType: camera.sourceType,
    snapshotUrl: "",
  };
}

export function CameraManager({
  cameras,
  initialCameraId,
  connectedCameraIds,
  onSaved,
  onConnect,
  onClose,
}: {
  cameras: Camera[];
  initialCameraId?: string | null;
  connectedCameraIds: string[];
  onSaved: () => Promise<void>;
  onConnect: (camera: Camera) => void;
  onClose: () => void;
}) {
  const initialCamera = initialCameraId
    ? cameras.find((camera) => camera.id === initialCameraId)
    : undefined;
  const [selectedId, setSelectedId] = useState<"new" | string>(
    initialCamera?.id ?? "new",
  );
  const [form, setForm] = useState<CameraConfigurationInput>(() =>
    initialCamera ? cameraToForm(initialCamera) : createEmptyForm(cameras),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedCamera = cameras.find((camera) => camera.id === selectedId);
  const hasLiveBrowserStream = selectedCamera
    ? connectedCameraIds.includes(selectedCamera.id)
    : false;
  const hasExistingHttpSource =
    selectedCamera?.sourceType === "http_snapshot" &&
    selectedCamera.sourceConfigured;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving && !isDeleting) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDeleting, isSaving, onClose]);

  function selectCamera(camera: Camera) {
    setSelectedId(camera.id);
    setForm(cameraToForm(camera));
    setError(null);
    setNotice(null);
    setIsConfirmingDelete(false);
  }

  function selectNewCamera() {
    setSelectedId("new");
    setForm(createEmptyForm(cameras));
    setError(null);
    setNotice(null);
    setIsConfirmingDelete(false);
  }

  function updateForm<Key extends keyof CameraConfigurationInput>(
    key: Key,
    value: CameraConfigurationInput[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const isCreating = selectedId === "new";
      const response = await fetch(
        isCreating
          ? "/api/cameras"
          : `/api/cameras/${encodeURIComponent(selectedId)}`,
        {
          method: isCreating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | Camera
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          body && "error" in body && body.error
            ? body.error
            : `Camera API returned ${response.status}`,
        );
      }

      const savedCamera = body as Camera;
      await onSaved();
      setSelectedId(savedCamera.id);
      setForm(cameraToForm(savedCamera));
      setNotice(isCreating ? "Camera added successfully" : "Camera updated successfully");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save camera",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (selectedId === "new" || isDeleting || isSaving) return;

    setIsDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/cameras/${encodeURIComponent(selectedId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `Camera API returned ${response.status}`);
      }

      await onSaved();
      setSelectedId("new");
      setForm(createEmptyForm(cameras.filter((camera) => camera.id !== selectedId)));
      setIsConfirmingDelete(false);
      setNotice("Camera deleted successfully");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete camera",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving && !isDeleting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-manager-title"
        className="w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-400">
              Camera network configuration
            </p>
            <h2 id="camera-manager-title" className="mt-2 text-lg font-semibold text-zinc-100">
              Manage cameras
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Add a camera or update the settings used by the Live dashboard.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close camera manager"
            onClick={onClose}
            disabled={isSaving || isDeleting}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="grid max-h-[75vh] overflow-y-auto md:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="border-b border-zinc-800 p-4 md:border-b-0 md:border-r">
            <Button variant="outline" className="w-full" onClick={selectNewCamera}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Add camera
            </Button>
            <div className="mt-4 grid gap-2">
              {cameras.map((camera) => (
                <button
                  key={camera.id}
                  type="button"
                  onClick={() => selectCamera(camera)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                    selectedId === camera.id
                      ? "border-zinc-600 bg-zinc-900"
                      : "border-zinc-800 bg-zinc-950 hover:border-zinc-700",
                  )}
                >
                  <CameraIcon className="h-4 w-4 shrink-0 text-zinc-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-zinc-300">
                      {camera.name}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] text-zinc-600">
                      {camera.code}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      camera.status === "online" ? "bg-emerald-400" : "bg-zinc-600",
                    )}
                  />
                </button>
              ))}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-sm font-semibold text-zinc-200">
                {selectedId === "new" ? "New camera" : "Edit camera"}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Runtime detection and signal fields are managed automatically.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">Name</span>
                <input
                  required
                  maxLength={60}
                  className={fieldClassName}
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Garage"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">Camera code</span>
                <input
                  required
                  maxLength={20}
                  className={fieldClassName}
                  value={form.code}
                  onChange={(event) => updateForm("code", event.target.value.toUpperCase())}
                  placeholder="CAM-05"
                />
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">Location</span>
                <input
                  required
                  maxLength={100}
                  className={fieldClassName}
                  value={form.location}
                  onChange={(event) => updateForm("location", event.target.value)}
                  placeholder="Southwest exterior"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">Status</span>
                <select
                  className={fieldClassName}
                  value={form.status}
                  onChange={(event) => {
                    const status = event.target.value as Camera["status"];
                    setForm((current) => ({
                      ...current,
                      status,
                      recording: status === "offline" ? false : current.recording,
                    }));
                  }}
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">Quality</span>
                <select
                  className={fieldClassName}
                  value={form.qualityLabel}
                  onChange={(event) => updateForm("qualityLabel", event.target.value)}
                >
                  <option value="1080P / IR">1080P / IR</option>
                  <option value="1080P / COLOR">1080P / Color</option>
                  <option value="2K / NIGHT">2K / Night</option>
                  <option value="4K / COLOR">4K / Color</option>
                </select>
              </label>
              <label className="grid gap-1.5 sm:col-span-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  Snapshot source
                </span>
                <select
                  className={fieldClassName}
                  value={form.sourceType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sourceType: event.target.value as Camera["sourceType"],
                      snapshotUrl: "",
                    }))
                  }
                >
                  <option value="simulated">Simulated snapshot</option>
                  <option value="http_snapshot">HTTP snapshot URL</option>
                </select>
              </label>
              {form.sourceType === "http_snapshot" && (
                <label className="grid gap-1.5 sm:col-span-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                    Private snapshot URL
                  </span>
                  <input
                    type="url"
                    maxLength={2048}
                    className={fieldClassName}
                    value={form.snapshotUrl ?? ""}
                    onChange={(event) => updateForm("snapshotUrl", event.target.value)}
                    placeholder={
                      hasExistingHttpSource
                        ? "Configured - leave blank to keep the current URL"
                        : "http://camera.local/snapshot.jpg"
                    }
                    required={!hasExistingHttpSource}
                  />
                  <span className="text-[10px] leading-4 text-zinc-600">
                    Alfred fetches this address on the server. It is never returned by the camera API.
                  </span>
                </label>
              )}
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-3">
              <input
                type="checkbox"
                checked={form.recording}
                disabled={form.status === "offline"}
                onChange={(event) => updateForm("recording", event.target.checked)}
                className="h-4 w-4 accent-red-600"
              />
              <span>
                <span className="block text-xs font-medium text-zinc-300">Recording enabled</span>
                <span className="mt-1 block text-[10px] text-zinc-600">
                  Offline cameras cannot record.
                </span>
              </span>
            </label>

            {selectedCamera && (
              <div className="mt-5 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-300">Live video source</p>
                  <p className="mt-1 text-[10px] leading-4 text-zinc-600">
                    {hasLiveBrowserStream
                      ? "A browser camera is currently attached to this camera view."
                      : "Attach an iPhone, webcam, or another browser-visible camera."}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={hasLiveBrowserStream ? "outline" : "default"}
                  onClick={() => onConnect(selectedCamera)}
                  disabled={isSaving || isDeleting}
                >
                  <CameraIcon className="mr-2 h-3.5 w-3.5" />
                  {hasLiveBrowserStream
                    ? "Change source"
                    : selectedCamera.status === "offline"
                      ? "Reconnect camera"
                      : "Connect live source"}
                </Button>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-lg border border-red-900/60 bg-red-950/25 px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}
            {notice && (
              <div className="mt-5 rounded-lg border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300">
                {notice}
              </div>
            )}

            {isConfirmingDelete && selectedId !== "new" && (
              <div className="mt-5 rounded-lg border border-red-900/60 bg-red-950/25 p-4">
                <p className="text-xs font-semibold text-red-200">
                  Delete this camera from the live network?
                </p>
                <p className="mt-1 text-[10px] text-red-300/70">
                  Historical events will remain available.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isDeleting}
                  >
                    Keep camera
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                    )}
                    Confirm delete
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-2 border-t border-zinc-800 pt-5">
              <div>
                {selectedId !== "new" && !isConfirmingDelete && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => setIsConfirmingDelete(true)}
                    disabled={isSaving || isDeleting}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving || isDeleting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting}>
                {isSaving ? (
                  <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3.5 w-3.5" />
                )}
                {selectedId === "new" ? "Add camera" : "Save changes"}
              </Button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
