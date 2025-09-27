import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { SkipLink } from "../ui/SkipLink";
import { cn } from "../../utils/cn";

export type RoleNavItem = {
  to: string;
  label: string;
};

type RoleLayoutProps = Readonly<{
  roleLabel: string;
  navItems: RoleNavItem[];
  children?: ReactNode;
  headerContent?: ReactNode;
}>;

export function RoleLayout({ roleLabel, navItems, headerContent }: RoleLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SkipLink />
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/60 p-6 dark:border-slate-800 dark:bg-slate-900/80 lg:block">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Panel</p>
            <h1 className="mt-2 text-xl font-semibold">{roleLabel}</h1>
          </div>
          <nav aria-label="Navegacion principal" className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="relative flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/70 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 lg:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="lg:hidden"
                onClick={() => setIsMobileNavOpen((prev) => !prev)}
                aria-label="Alternar menu de navegacion"
              >
                <span className="text-sm font-semibold uppercase">Menu</span>
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">{roleLabel}</span>
            </div>
            <div className="flex items-center gap-3">{headerContent}</div>
          </header>
          {isMobileNavOpen ? (
            <nav
              aria-label="Navegacion movil"
              className="border-b border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:hidden"
            >
              <div className="space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-md px-3 py-2 text-sm font-medium",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </nav>
          ) : null}
          <main id="contenido-principal" className="flex-1 px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
