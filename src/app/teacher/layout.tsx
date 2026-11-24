
import { Suspense } from "react";
import TeacherSidebar from "./components/TeacherSidebar";
import TeacherHeader from "./components/TeacherHeader";

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Suspense
        fallback={
          <aside className="min-h-screen w-64 bg-slate-900" />
        }
      >
        <TeacherSidebar />
      </Suspense>

      <div className="min-w-0 flex-1">
        <Suspense
          fallback={
            <header className="h-20 border-b border-slate-200 bg-white" />
          }
        >
          <TeacherHeader />
        </Suspense>

        <main className="p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
