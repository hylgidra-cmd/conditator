export default function RootLoading() {
  return (
    <div className="page-x space-y-6 py-10">
      <div className="ds-skeleton h-10 w-64 rounded-2xl" />
      <div className="grid gap-5 md:grid-cols-3">
        <div className="ds-skeleton h-44 rounded-3xl" />
        <div className="ds-skeleton h-44 rounded-3xl" />
        <div className="ds-skeleton h-44 rounded-3xl" />
      </div>
      <div className="ds-skeleton h-72 rounded-3xl" />
    </div>
  );
}
