
import type { ReactNode } from "react";
import { Suspense } from "react";
import StudentSidebar from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";

export default function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Suspense
  fallback={
    <div className="w-64 bg-slate-950" />
  }
>
  <StudentSidebar />
</Suspense>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <StudentHeader />

        <main className="flex-1 p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
