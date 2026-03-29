import { SiteHeader } from "@/components/SiteHeader";
import { GenerateDashboard } from "@/components/GenerateDashboard";

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-800">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Create your next post
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Built for owners in Mimico who want consistent, on-brand social copy without starting from a blank page.
          </p>
        </div>
        <GenerateDashboard />
      </main>
    </>
  );
}
