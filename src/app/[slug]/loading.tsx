export default function StorefrontLoadingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl animate-pulse px-3 pb-24 pt-3 md:px-6 md:pb-8">
      <header className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-zinc-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-52 rounded bg-zinc-200" />
            <div className="h-4 w-64 rounded bg-zinc-100" />
          </div>
        </div>
        <div className="mt-4 h-11 rounded-xl bg-zinc-100" />
      </header>

      <div className="mb-4 flex gap-2 overflow-hidden">
        <div className="h-9 w-20 rounded-full bg-zinc-200" />
        <div className="h-9 w-24 rounded-full bg-zinc-100" />
        <div className="h-9 w-24 rounded-full bg-zinc-100" />
      </div>

      <section className="grid gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <div className="h-28 rounded-xl bg-zinc-100" />
            <div className="space-y-2">
              <div className="h-5 w-56 rounded bg-zinc-200" />
              <div className="h-4 w-44 rounded bg-zinc-100" />
              <div className="h-4 w-32 rounded bg-zinc-100" />
              <div className="mt-3 h-9 w-48 rounded-lg bg-zinc-100" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-3">
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <div className="h-28 rounded-xl bg-zinc-100" />
            <div className="space-y-2">
              <div className="h-5 w-48 rounded bg-zinc-200" />
              <div className="h-4 w-52 rounded bg-zinc-100" />
              <div className="h-4 w-28 rounded bg-zinc-100" />
              <div className="mt-3 h-9 w-44 rounded-lg bg-zinc-100" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
