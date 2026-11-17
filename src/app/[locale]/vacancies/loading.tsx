export default function VacanciesLoading() {
  return (
    <div className="page-x space-y-6 py-8 sm:py-12">
      <div className="ds-skeleton h-48 rounded-3xl" />
      <div className="grid gap-4">
        <div className="ds-skeleton h-36 rounded-3xl" />
        <div className="ds-skeleton h-36 rounded-3xl" />
        <div className="ds-skeleton h-36 rounded-3xl" />
      </div>
    </div>
  );
}
