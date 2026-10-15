import Link from "next/link";

/** GET search form plus suggestion chips; results are rendered by the page from `?q=`. */
export function SearchForm({
  action,
  q,
  label,
  placeholder,
  suggestions,
  hidden = {},
}: {
  action: string;
  q: string;
  label: string;
  placeholder: string;
  suggestions: string[];
  /** Extra query parameters to carry through searches and suggestion links. */
  hidden?: Record<string, string>;
}) {
  const href = (s: string) => `${action}?${new URLSearchParams({ ...hidden, q: s })}`;

  return (
    <>
      <form action={action} role="search" className="flex gap-2">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <label htmlFor="q" className="sr-only">
          {label}
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-full border border-line bg-panel px-4 py-3 text-base placeholder:text-faint focus:border-muted focus:outline-none sm:px-5"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-white px-5 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-85 sm:px-6"
        >
          Search
        </button>
      </form>
      <ul className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const active = s.toLowerCase() === q.toLowerCase();
          return (
            <li key={s}>
              <Link
                href={href(s)}
                aria-current={active ? "true" : undefined}
                className={`inline-block rounded-full border px-3 py-1.5 text-sm transition-colors sm:py-1 ${
                  active ? "border-muted text-white" : "border-line text-muted hover:text-white"
                }`}
              >
                {s}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
