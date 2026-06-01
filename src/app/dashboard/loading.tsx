export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-8">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-[#f0ede8]">Dashboard</h1>
          <div className="h-4 w-56 rounded bg-white/[0.05]" />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-xl border border-white/[0.08] bg-[#0c0c0c]"
            />
          ))}
        </div>

        <div className="h-24 rounded-xl border border-white/[0.08] bg-[#0c0c0c]" />
        <div className="h-72 rounded-xl border border-white/[0.08] bg-[#0c0c0c]" />
      </div>
    </div>
  );
}
