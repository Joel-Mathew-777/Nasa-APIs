"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { catalog } from "@/lib/catalog";

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 py-4 text-sm font-medium tracking-tight">
          <span className="size-2 rounded-full bg-accent" aria-hidden />
          Open NASA
        </Link>
        <nav className="no-scrollbar -mr-5 flex flex-1 gap-1 overflow-x-auto pr-5 sm:mr-0 sm:justify-end sm:pr-0">
          {catalog.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  active ? "bg-raised text-white" : "text-muted hover:text-white"
                }`}
              >
                {item.nav}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
