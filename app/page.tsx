import { Grid2X2 } from "lucide-react";
import { activeAlert, cameras } from "@/data/mock-data";
import { AlertBanner } from "@/components/alert-banner";
import { CameraCard } from "@/components/camera-card";
import { EventFeed } from "@/components/event-feed";
import { ReviewQueue } from "@/components/review-queue";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none fixed left-1/2 top-[-20rem] h-[38rem] w-[60rem] -translate-x-1/2 rounded-full bg-red-950/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <SiteHeader />

        <div className="mt-6">
          <AlertBanner />
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <SectionHeading
              icon={Grid2X2}
              eyebrow="Live surveillance"
              title="Camera network"
              count={cameras.length}
            />
            <div className="grid gap-4 md:grid-cols-2">
              {cameras.map((camera) => (
                <CameraCard key={camera.id} camera={camera} />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Cameras online", `${cameras.filter((c) => c.status === "online").length}/${cameras.length}`],
                ["Events today", "12"],
                ["Storage", "82%"],
                ["Threat state", activeAlert.active ? "Active" : "Clear"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-950/45 px-4 py-3"
                >
                  <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                    {label}
                  </p>
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      label === "Threat state" && activeAlert.active
                        ? "text-red-400"
                        : "text-zinc-300"
                    }`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="grid content-start gap-8 lg:grid-cols-2 xl:grid-cols-1">
            <EventFeed />
            <ReviewQueue />
          </aside>
        </div>

        <footer className="mt-10 flex flex-col gap-2 border-t border-zinc-900 pt-5 font-mono text-[9px] uppercase tracking-widest text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>Alfred monitoring node / residential perimeter</span>
          <span>Local processing enabled · Data encrypted</span>
        </footer>
      </div>
    </main>
  );
}
