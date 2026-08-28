export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] h-full w-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm uppercase tracking-wide text-muted font-bold">Loading module...</p>
      </div>
    </div>
  );
}
