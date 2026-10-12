export default function Loading() {
  return (
    <div className="pt-14 sm:pt-20" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton mt-5 h-12 w-full max-w-xl rounded-lg" />
      <div className="skeleton mt-5 h-5 w-full max-w-2xl rounded" />
      <div className="skeleton mt-14 h-32 rounded-xl" />
      <div className="skeleton mt-6 h-96 rounded-xl" />
    </div>
  );
}
