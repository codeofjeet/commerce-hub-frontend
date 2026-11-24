
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "🏠",
  },
  {
    label: "Answer Verification",
    href: "/admin/answer-verification",
    icon: "📝",
  },
  {
    label: "Evaluations",
    href: "/admin/evaluations",
    icon: "📊",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("commerceHubToken");
    localStorage.removeItem("commerceHubUser");
    router.push("/login");
  };

  return (
    <aside className="flex min-h-screen w-64 flex-col bg-slate-950 text-white">
      {/* Logo */}
      <div className="border-b border-slate-800 px-6 py-6">
        <h2 className="text-xl font-bold">Commerce Hub</h2>
        <p className="mt-1 text-xs font-medium tracking-wider text-blue-400">
          ADMIN PORTAL
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-7">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-red-500/40 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white"
        >
          ↪ Logout
        </button>
      </div>
    </aside>
  );
}
