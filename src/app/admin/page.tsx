
import Link from "next/link";

const dashboardSections = [
  {
    title: "Answer Verification",
    description: "Review teacher answers and publish verified questions.",
    href: "/admin/answer-verification",
    icon: "📝",
  },
  {
    title: "Evaluations",
    description: "Manage student evaluations and performance.",
    href: "/admin/evaluations",
    icon: "📊",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Commerce Hub Kota
        </p>

        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Dashboard Overview
        </h2>

        <p className="mt-2 text-slate-600">
          Manage students, teachers, questions and academic activities
          from your administration panel.
        </p>
      </section>

      {/* Dashboard Welcome Card */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-white shadow-md">
        <h3 className="text-2xl font-bold">
          Welcome to Admin Dashboard!
        </h3>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
          Monitor academic activities, review teacher submissions and
          manage the Commerce Hub Kota learning platform.
        </p>
      </section>

      {/* Dashboard Sections */}
      <section>
        <h3 className="mb-4 text-xl font-bold text-slate-900">
          Management Sections
        </h3>

        <div className="grid gap-5 md:grid-cols-2">
          {dashboardSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  {section.icon}
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                    {section.title}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {section.description}
                  </p>

                  <span className="mt-4 inline-block text-sm font-semibold text-blue-600">
                    Open Section →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
