
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PracticeAttempt {
  _id: string;
  subject: {
    _id: string;
    name: string;
  };
  chapter: {
    _id: string;
    title: string;
    chapterNumber: number;
  };
  board: string;
  courseLevel: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

interface TimedTestAttempt {
  _id: string;
  test: {
    _id: string;
    title: string;
    description?: string;
    subject: string;
    durationMinutes: number;
  } | null;
  totalQuestions: number;
  totalMarks: number;
  marksObtained: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  status: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  evaluatedAt?: string | null;
  createdAt: string;
}

export default function StudentResultsPage() {
  const router = useRouter();

  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [timedAttempts, setTimedAttempts] = useState<TimedTestAttempt[]>([]);

  const [loading, setLoading] = useState(true);
  const [timedLoading, setTimedLoading] = useState(true);

  const [error, setError] = useState("");
  const [timedError, setTimedError] = useState("");

  // Format date
  const formatDate = (date?: string | null) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch chapter practice history
  const fetchAttempts = useCallback(async () => {
    try {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/practice/my-attempts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load practice history."
        );
      }

      setAttempts(result.data || []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load practice history."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch timed test history
  const fetchTimedAttempts = useCallback(async () => {
    try {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) return;

      const response = await fetch(
        `${API_URL}/api/student-timed-tests/attempts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load timed test history."
        );
      }

      setTimedAttempts(result.data || []);
      setTimedError("");
    } catch (err) {
      setTimedError(
        err instanceof Error
          ? err.message
          : "Unable to load timed test history."
      );
    } finally {
      setTimedLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAttempts();
      void fetchTimedAttempts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchAttempts, fetchTimedAttempts]);

  // Chapter practice statistics
  const completedAttempts = attempts.filter(
    (item) => item.status === "completed"
  ).length;

  const totalQuestions = attempts.reduce(
    (total, item) => total + item.totalQuestions,
    0
  );

  const totalAnswered = attempts.reduce(
    (total, item) => total + item.answeredQuestions,
    0
  );

  // Timed test statistics
  const evaluatedTests = timedAttempts.filter(
    (item) => item.status === "evaluated"
  ).length;

  const totalTimedQuestions = timedAttempts.reduce(
    (total, item) => total + item.totalQuestions,
    0
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "evaluated":
        return "bg-green-50 text-green-700";

      case "submitted":
        return "bg-orange-50 text-orange-700";

      case "in_progress":
        return "bg-blue-50 text-blue-700";

      case "expired":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "evaluated":
        return "Evaluated";

      case "submitted":
        return "Pending Evaluation";

      case "in_progress":
        return "In Progress";

      case "expired":
        return "Expired";

      default:
        return status.replaceAll("_", " ");
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f7ff] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
              Commerce Hub Kota
            </span>

            <h1 className="mt-5 text-3xl font-bold text-[#193b70]">
              My Results
            </h1>

            <p className="mt-2 text-slate-500">
              Track your chapter practice and timed examination results.
            </p>
          </div>

          <button
            onClick={() => router.push("/student/dashboard")}
            className="rounded-xl bg-[#193b70] px-5 py-3 font-semibold text-white transition hover:bg-[#245394]"
          >
            ← Dashboard
          </button>
        </div>

        {/* Chapter Practice Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Chapter Practice Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#193b70]">
              Chapter Practice History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your previous chapter-wise practice sessions.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

              <p className="font-semibold text-[#193b70]">
                Loading practice history...
              </p>
            </div>
          ) : (
            <>
              {/* Practice Statistics */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Total Practice Sessions
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-blue-700">
                    {attempts.length}
                  </h3>
                </div>

                <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Completed Sessions
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-green-700">
                    {completedAttempts}
                  </h3>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Questions Answered
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-purple-700">
                    {totalAnswered} / {totalQuestions}
                  </h3>
                </div>
              </div>

              {/* Practice History List */}
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-[#193b70]">
                    Previous Practice Sessions
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Open a completed session to view your marks and feedback.
                  </p>
                </div>

                {attempts.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="text-5xl">📚</div>

                    <h3 className="mt-4 text-lg font-bold text-[#193b70]">
                      No Practice History
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      You have not started any practice sessions yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {attempts.map((attempt) => (
                      <div
                        key={attempt._id}
                        className="p-6 transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                {attempt.board}
                              </span>

                              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                                Class {attempt.courseLevel}
                              </span>

                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                                {attempt.status.replaceAll("_", " ")}
                              </span>
                            </div>

                            <h3 className="mt-4 text-lg font-bold text-[#193b70]">
                              {attempt.subject?.name || "Subject"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              Chapter {attempt.chapter?.chapterNumber}:{" "}
                              {attempt.chapter?.title || "Chapter"}
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                              Started: {formatDate(attempt.startedAt)}
                            </p>

                            {attempt.completedAt && (
                              <p className="mt-1 text-xs text-slate-400">
                                Completed: {formatDate(attempt.completedAt)}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-3 lg:min-w-[300px]">
                            <div className="rounded-xl bg-blue-50 p-3 text-center">
                              <h4 className="text-2xl font-bold text-blue-700">
                                {attempt.totalQuestions}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Questions
                              </p>
                            </div>

                            <div className="rounded-xl bg-green-50 p-3 text-center">
                              <h4 className="text-2xl font-bold text-green-700">
                                {attempt.answeredQuestions}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Answered
                              </p>
                            </div>

                            <div className="rounded-xl bg-purple-50 p-3 text-center">
                              <h4 className="text-2xl font-bold text-purple-700">
                                {attempt.correctAnswers}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                Correct
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                          <button
                            onClick={() =>
                              router.push(
                                `/student/practice/${attempt._id}`
                              )
                            }
                            className="rounded-xl bg-[#193b70] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#245394]"
                          >
                            View Result →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Timed Test History Section */}
        <section>
          <div className="mb-6">
            <span className="rounded-full bg-purple-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-purple-700">
              Examination Records
            </span>

            <h2 className="mt-5 text-2xl font-bold text-[#193b70]">
              Timed Test History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View your examination attempts, marks and teacher evaluations.
            </p>
          </div>

          {timedError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {timedError}
            </div>
          )}

          {timedLoading ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-100 border-t-purple-700" />

              <p className="font-semibold text-[#193b70]">
                Loading timed test history...
              </p>
            </div>
          ) : (
            <>
              {/* Timed Test Statistics */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Total Examinations
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-blue-700">
                    {timedAttempts.length}
                  </h3>
                </div>

                <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Evaluated Examinations
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-green-700">
                    {evaluatedTests}
                  </h3>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">
                    Total Questions
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-purple-700">
                    {totalTimedQuestions}
                  </h3>
                </div>
              </div>

              {/* Timed Test List */}
              <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <h3 className="text-xl font-bold text-[#193b70]">
                    Previous Timed Examinations
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Review your submitted and evaluated examinations.
                  </p>
                </div>

                {timedAttempts.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-5xl">📝</div>

                    <h3 className="mt-4 text-xl font-bold text-[#193b70]">
                      No Timed Tests Yet
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      Your examination history will appear here after you start a timed test.
                    </p>

                    <button
                      onClick={() => router.push("/student/timed-tests")}
                      className="mt-6 rounded-xl bg-[#193b70] px-6 py-3 font-semibold text-white"
                    >
                      Explore Timed Tests
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {timedAttempts.map((attempt) => {
                      const percentage =
                        attempt.totalMarks > 0
                          ? (
                              (attempt.marksObtained /
                                attempt.totalMarks) *
                              100
                            ).toFixed(1)
                          : "0.0";

                      return (
                        <div
                          key={attempt._id}
                          className="p-6 transition hover:bg-slate-50"
                        >
                          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                            {/* Test Details */}
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                  Timed Examination
                                </span>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                                    attempt.status
                                  )}`}
                                >
                                  {getStatusLabel(attempt.status)}
                                </span>
                              </div>

                              <h3 className="mt-4 text-lg font-bold text-[#193b70]">
                                {attempt.test?.title || "Timed Test"}
                              </h3>

                              {attempt.test?.description && (
                                <p className="mt-1 text-sm text-slate-500">
                                  {attempt.test.description}
                                </p>
                              )}

                              <p className="mt-3 text-xs text-slate-400">
                                Started: {formatDate(attempt.startedAt)}
                              </p>

                              {attempt.submittedAt && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Submitted: {formatDate(attempt.submittedAt)}
                                </p>
                              )}

                              {attempt.evaluatedAt && (
                                <p className="mt-1 text-xs text-green-600">
                                  Evaluated: {formatDate(attempt.evaluatedAt)}
                                </p>
                              )}

                              <p className="mt-2 text-xs text-slate-500">
                                Duration:{" "}
                                {attempt.test?.durationMinutes ?? "—"} minutes
                              </p>
                            </div>

                            {/* Test Statistics */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[440px]">
                              <div className="rounded-xl bg-blue-50 p-3 text-center">
                                <h4 className="text-xl font-bold text-blue-700">
                                  {attempt.totalQuestions}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500">
                                  Questions
                                </p>
                              </div>

                              <div className="rounded-xl bg-green-50 p-3 text-center">
                                <h4 className="text-xl font-bold text-green-700">
                                  {attempt.answeredQuestions}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500">
                                  Answered
                                </p>
                              </div>

                              <div className="rounded-xl bg-purple-50 p-3 text-center">
                                <h4 className="text-xl font-bold text-purple-700">
                                  {attempt.marksObtained ?? 0}/
                                  {attempt.totalMarks}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500">
                                  Marks
                                </p>
                              </div>

                              <div className="rounded-xl bg-orange-50 p-3 text-center">
                                <h4 className="text-xl font-bold text-orange-700">
                                  {percentage}%
                                </h4>
                                <p className="mt-1 text-xs text-slate-500">
                                  Percentage
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* View Result */}
                          <div className="mt-5 flex justify-end">
                            <button
                              onClick={() =>
                                router.push(
                                  `/student/practice/result/${attempt._id}`
                                )
                              }
                              className="rounded-xl bg-[#193b70] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#245394]"
                            >
                              View Examination Result →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

      </div>
    </main>
  );
}
