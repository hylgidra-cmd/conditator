export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="ds-skeleton h-10 w-56 rounded-2xl" />
        <div className="ds-skeleton h-11 w-96 rounded-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ds-skeleton h-28 rounded-3xl" />
        <div className="ds-skeleton h-28 rounded-3xl" />
        <div className="ds-skeleton h-28 rounded-3xl" />
        <div className="ds-skeleton h-28 rounded-3xl" />
      </div>
      <div className="ds-skeleton h-80 rounded-3xl" />
    </div>
  );
}
