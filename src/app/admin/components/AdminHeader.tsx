
"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  name?: string;
  email?: string;
  role?: string;
}

export default function AdminHeader() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedUser = localStorage.getItem("commerceHubUser");

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as AdminUser;

          if (parsedUser.role === "admin") {
            setAdmin(parsedUser);
          }
        }
      } catch (error) {
        console.error("Unable to read admin details:", error);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <header className="flex min-h-[82px] items-center justify-between border-b border-slate-200 bg-white px-6 py-4 md:px-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Admin Portal
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Welcome to Commerce Hub Kota Administration
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {admin?.name || "Administrator"}
          </p>

          <p className="text-xs text-slate-500">
            {admin?.email || "Admin Account"}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
          {admin?.name?.charAt(0).toUpperCase() || "A"}
        </div>
      </div>
    </header>
  );
}
