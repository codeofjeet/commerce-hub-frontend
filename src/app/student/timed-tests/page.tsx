
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Subject {
  _id: string;
  name: string;
  slug: string;
}

interface Chapter {
  _id: string;
  title: string;
  chapterNumber: number;
}

interface TimedTest {
  _id: string;
  title: string;
  description: string;
  subject: Subject;
  chapters: Chapter[];
  board: string;
  courseLevel: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  createdAt: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StudentTimedTestsPage() {
  const router = useRouter();

  const [tests, setTests] = useState<TimedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchTests = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/timed-tests/student/available`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("commerceHubToken");
        localStorage.removeItem("commerceHubUser");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load available tests."
        );
      }

      setTests(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

 
useEffect(() => {
  let cancelled = false;

  const loadAvailableTests = async () => {
    try {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/timed-tests/student/available`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (cancelled) return;

      if (response.status === 401) {
        localStorage.removeItem("commerceHubToken");
        localStorage.removeItem("commerceHubUser");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load available tests."
        );
      }

      setTests(result.data || []);
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void loadAvailableTests();

  return () => {
    cancelled = true;
  };
}, [router]);


  const filteredTests = tests.filter((test) => {
    const searchText = search.toLowerCase();

    return (
      test.title.toLowerCase().includes(searchText) ||
      test.subject?.name.toLowerCase().includes(searchText) ||
      test.chapters?.some((chapter) =>
        chapter.title.toLowerCase().includes(searchText)
      )
    );
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f7ff] px-4 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
          <h2 className="font-semibold text-[#193b70]">
            Loading Available Tests...
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f7ff] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">

        {/* Page Heading */}
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700">
            <span>📝</span>
            Online Examination
          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#193b70] sm:text-4xl">
                Timed Examinations
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                View your available tests and evaluate your preparation
                with timed examinations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchTests(true)}
              disabled={refreshing}
              className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-[#193b70] transition hover:bg-blue-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "↻ Refresh Tests"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => void fetchTests(true)}
              className="font-semibold text-red-700 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Available Tests</p>
            <h2 className="mt-2 text-3xl font-bold text-[#193b70]">
              {tests.length}
            </h2>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Questions</p>
            <h2 className="mt-2 text-3xl font-bold text-green-700">
              {tests.reduce(
                (total, test) => total + test.totalQuestions,
                0
              )}
            </h2>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Test Marks</p>
            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              {tests.reduce(
                (total, test) => total + test.totalMarks,
                0
              )}
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test name, subject or chapter..."
            className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Tests */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#193b70]">
            Available Tests
          </h2>

          <span className="text-sm text-slate-500">
            {filteredTests.length} Tests
          </span>
        </div>

        {filteredTests.length === 0 ? (
          <div className="rounded-3xl border border-blue-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mb-5 text-6xl">📚</div>

            <h3 className="text-xl font-bold text-[#193b70]">
              {tests.length === 0
                ? "No Tests Available"
                : "No Matching Tests Found"}
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              {tests.length === 0
                ? "Your teachers or administrator have not published any timed tests for your academic program yet."
                : "Try another search term to find your test."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredTests.map((test) => (
              <div
                key={test._id}
                className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-[#193b70] to-[#2865ae] p-6 text-white">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                      {test.board} · Class {test.courseLevel}
                    </span>

                    <span className="text-3xl">📝</span>
                  </div>

                  <h3 className="text-xl font-bold">
                    {test.title}
                  </h3>

                  <p className="mt-2 text-sm text-blue-100">
                    {test.description || "Test your subject knowledge."}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Subject
                    </p>

                    <p className="mt-1 font-bold text-[#193b70]">
                      {test.subject?.name || "Subject"}
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Included Chapters
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {test.chapters?.map((chapter) => (
                        <span
                          key={chapter._id}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700"
                        >
                          Ch. {chapter.chapterNumber}: {chapter.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Test Details */}
                  <div className="grid grid-cols-3 gap-3 border-y border-slate-100 py-5">
                    <div className="text-center">
                      <div className="text-xl">⏱️</div>
                      <p className="mt-2 text-lg font-bold text-[#193b70]">
                        {test.durationMinutes}
                      </p>
                      <p className="text-xs text-slate-500">
                        Minutes
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="text-xl">❓</div>
                      <p className="mt-2 text-lg font-bold text-[#193b70]">
                        {test.totalQuestions}
                      </p>
                      <p className="text-xs text-slate-500">
                        Questions
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="text-xl">🏆</div>
                      <p className="mt-2 text-lg font-bold text-[#193b70]">
                        {test.totalMarks}
                      </p>
                      <p className="text-xs text-slate-500">
                        Total Marks
                      </p>
                    </div>
                  </div>

                  {/* Start Test */}
                  <Link
                    href={`/student/practice/instructions/${test._id}`}
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#193b70] px-5 py-4 font-bold text-white transition hover:bg-[#245394]"
                  >
                    View Instructions & Start Test →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/student/dashboard")}
          className="mt-10 w-full rounded-xl border border-blue-200 bg-white px-5 py-4 font-semibold text-[#193b70] transition hover:bg-blue-50"
        >
          ← Back to Dashboard
        </button>

      </div>
    </main>
  );
}
