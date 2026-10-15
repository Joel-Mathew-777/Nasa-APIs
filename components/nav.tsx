"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { catalog } from "@/lib/catalog";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex shrink-0 items-center gap-2.5 py-4 text-sm font-medium tracking-tight"
        >
          <span className="size-2 rounded-full bg-accent" aria-hidden />
          Open NASA
        </Link>
        <nav aria-label="Main" className="no-scrollbar hidden min-w-0 gap-0.5 overflow-x-auto xl:flex">
          {catalog.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  active ? "bg-raised text-white" : "text-muted hover:text-white"
                }`}
              >
                {item.nav}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2.5 flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:text-white xl:hidden"
        >
          <svg
            viewBox="0 0 20 20"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-line xl:hidden"
        >
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-1 px-3 py-3 sm:grid-cols-4 sm:px-6">
            {catalog.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-3 text-sm transition-colors ${
                      active ? "bg-raised text-white" : "text-muted hover:text-white"
                    }`}
                  >
                    {item.nav}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
