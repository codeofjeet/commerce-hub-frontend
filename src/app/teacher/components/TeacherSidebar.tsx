
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const menuItems = [
  { name: "Dashboard", href: "/teacher", icon: "🏠" },
  { name: "Student Questions", href: "/teacher/questions", icon: "📩" },
  { name: "My Answers", href: "/teacher/my-answers", icon: "📝" },
  { name: "Evaluations", href: "/teacher/evaluations", icon: "📊" },
  { name: "Timed Test Evaluation", href: "/teacher/timed-tests", icon: "⏱️" },
  { name: "Performance Reports", href: "/teacher/performance-reports", icon: "📈" },
  { name: "My Profile", href: "/teacher/profile", icon: "👤" },
];

interface Teacher {
  name: string;
  email: string;
  role: string;
}

export default function TeacherSidebar() {
  const pathname = usePathname();

  const [teacher, setTeacher] = useState<Teacher | null>(null);

  const fetchTeacherProfile = useCallback(async () => {
    const token = localStorage.getItem("commerceHubToken");

    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/teachers/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load teacher profile"
        );
      }

      setTeacher(result.data);
    } catch (error) {
      console.error("Sidebar profile error:", error);
    }
  }, []);

  useEffect(() => {
    const initialFetch = setTimeout(() => {
      fetchTeacherProfile();
    }, 0);

    return () => clearTimeout(initialFetch);
  }, [fetchTeacherProfile]);

  const initials = teacher?.name
    ? teacher.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
    : "T";

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col bg-slate-900 text-white">

      {/* Logo */}
      <div className="border-b border-slate-700 px-6 py-7">
        <h2 className="text-xl font-bold text-white">
          Commerce Hub
        </h2>

        <p className="mt-1 text-xs tracking-wider text-blue-400">
          TEACHER PORTAL
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        {menuItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/teacher" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Dynamic Teacher Account */}
      <div className="border-t border-slate-700 p-5">
        <Link
          href="/teacher/profile"
          className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-slate-800"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold uppercase text-blue-700">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {teacher?.name || "Teacher Account"}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              {teacher?.email || "Commerce Hub Kota"}
            </p>

            <p className="mt-1 text-[11px] text-blue-400">
              {teacher?.role
                ? teacher.role.charAt(0).toUpperCase() +
                  teacher.role.slice(1)
                : "Faculty Member"}
            </p>
          </div>
        </Link>
      </div>

    </aside>
  );
}
