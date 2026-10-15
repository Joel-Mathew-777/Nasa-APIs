import "server-only";

export const HOUR = 3600;

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const NASA_LIMIT = "Rate limit reached. Add your own NASA_API_KEY to lift it.";

export async function get<T>(
  url: string,
  revalidate = HOUR,
  timeout = 15000,
  rateLimited = NASA_LIMIT,
): Promise<Result<T>> {
  try {
    const res = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(timeout),
    });
    if (res.status === 429) return { ok: false, error: rateLimited };
    if (!res.ok) return { ok: false, error: `The service responded with ${res.status}.` };
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    return {
      ok: false,
      error: timedOut ? "The service took too long to respond." : "The service could not be reached.",
    };
  }
}

export function map<T, U>(r: Result<T>, fn: (data: T) => U): Result<U> {
  return r.ok ? { ok: true, data: fn(r.data) } : r;
}
