
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// TYPES
// ==========================================

interface SubjectStatistics {
  subjectId: string;
  subjectName: string;
  answersSubmitted: number;
  verifiedAnswers: number;
  pendingQuestions: number;
}

interface MonthlyActivity {
  year: number;
  month: number;
  answersSubmitted: number;
  timedAnswersEvaluated: number;
  marksAwarded: number;
}

interface TimedTestPerformance {
  totalEvaluated: number;
  totalMarksAwarded: number;
}

interface PerformanceReports {
  subjectStatistics: SubjectStatistics[];
  monthlyActivity: MonthlyActivity[];
  timedTestPerformance: TimedTestPerformance;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: PerformanceReports;
}

// ==========================================
// HELPERS
// ==========================================

function getMonthName(month: number): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr",
    "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec",
  ];

  return months[month - 1] || "";
}

// ==========================================
// PAGE
// ==========================================

export default function TeacherPerformanceReportsPage() {
  const [reports, setReports] =
    useState<PerformanceReports | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("commerceHubToken");

        if (!token) {
          setError("Please log in to view performance reports.");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/question-submissions/teacher/performance-reports`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result: ApiResponse = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "Failed to load performance reports."
          );
        }

        if (!controller.signal.aborted) {
          setReports(result.data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading reports."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-slate-800">
            Teacher Performance Reports
          </h1>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8">
            <p className="animate-pulse text-slate-500">
              Loading performance reports...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !reports) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-slate-800">
            Teacher Performance Reports
          </h1>

          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-700">
              {error || "No performance reports available."}
            </p>

            <Link
              href="/teacher"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // CALCULATED STATISTICS
  // ==========================================

  const totalAnswersSubmitted =
    reports.subjectStatistics.reduce(
      (total, subject) => total + subject.answersSubmitted,
      0
    );

  const totalVerifiedAnswers =
    reports.subjectStatistics.reduce(
      (total, subject) => total + subject.verifiedAnswers,
      0
    );

  const totalPendingQuestions =
    reports.subjectStatistics.reduce(
      (total, subject) => total + subject.pendingQuestions,
      0
    );

  const chartData = reports.monthlyActivity.map((item) => ({
    month: `${getMonthName(item.month)} ${item.year}`,
    answersSubmitted: item.answersSubmitted,
    timedAnswersEvaluated: item.timedAnswersEvaluated,
    marksAwarded: item.marksAwarded,
  }));

  const summaryCards = [
    {
      title: "Answers Submitted",
      value: totalAnswersSubmitted,
      icon: "📝",
      color: "text-blue-600",
    },
    {
      title: "Verified Answers",
      value: totalVerifiedAnswers,
      icon: "✅",
      color: "text-green-600",
    },
    {
      title: "Pending Questions",
      value: totalPendingQuestions,
      icon: "📩",
      color: "text-orange-600",
    },
    {
      title: "Timed Answers Evaluated",
      value: reports.timedTestPerformance.totalEvaluated,
      icon: "⏱️",
      color: "text-purple-600",
    },
    {
      title: "Total Marks Awarded",
      value: reports.timedTestPerformance.totalMarksAwarded,
      icon: "🏆",
      color: "text-indigo-600",
    },
    {
      title: "Assigned Subjects",
      value: reports.subjectStatistics.length,
      icon: "📚",
      color: "text-teal-600",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            COMMERCE HUB KOTA
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Teacher Performance Reports
              </h1>

              <p className="mt-2 text-slate-500">
                Monitor teaching activities, answer verification,
                and examination evaluations.
              </p>
            </div>

            <Link
              href="/teacher"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <span className="text-2xl">{card.icon}</span>
              </div>

              <h2
                className={`mt-4 text-3xl font-bold ${card.color}`}
              >
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        {/* MONTHLY ACTIVITY CHART */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">
            Monthly Teacher Activity
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Answers submitted and timed examination answers evaluated
            during the last six months.
          </p>

          <div className="mt-6 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="answersSubmitted"
                  name="Answers Submitted"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="timedAnswersEvaluated"
                  name="Timed Answers Evaluated"
                  fill="#16a34a"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SUBJECT-WISE STATISTICS */}
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800">
              Subject-wise Performance
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Statistics for subjects assigned to this teacher.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    Subject
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Answers Submitted
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Verified Answers
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Pending Questions
                  </th>
                </tr>
              </thead>

              <tbody>
                {reports.subjectStatistics.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No assigned subjects found.
                    </td>
                  </tr>
                ) : (
                  reports.subjectStatistics.map((subject) => (
                    <tr
                      key={subject.subjectId}
                      className="border-t border-slate-200"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {subject.subjectName}
                      </td>

                      <td className="px-6 py-4 text-blue-600">
                        {subject.answersSubmitted}
                      </td>

                      <td className="px-6 py-4 text-green-600">
                        {subject.verifiedAnswers}
                      </td>

                      <td className="px-6 py-4 text-orange-600">
                        {subject.pendingQuestions}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TIMED EXAMINATION PERFORMANCE */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-bold text-blue-900">
            Timed Examination Evaluation Performance
          </h2>

          <p className="mt-2 text-sm text-blue-800">
            Summary of written examination answers reviewed by
            this teacher.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-5">
              <p className="text-sm text-slate-500">
                Total Answers Evaluated
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-600">
                {reports.timedTestPerformance.totalEvaluated}
              </p>
            </div>

            <div className="rounded-lg bg-white p-5">
              <p className="text-sm text-slate-500">
                Total Marks Awarded
              </p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {reports.timedTestPerformance.totalMarksAwarded}
              </p>
            </div>
          </div>

          <Link
            href="/teacher/timed-tests"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open Timed Test Evaluation →
          </Link>
        </div>

      </div>
    </main>
  );
}
