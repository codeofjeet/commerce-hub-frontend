
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface TimedTest {
  _id: string;
  title: string;
  description?: string;
  subject?: {
    _id: string;
    name: string;
    slug?: string;
  };
  chapters?: {
    _id: string;
    title: string;
    chapterNumber: number;
  }[];
  board: string;
  courseLevel: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  isActive: boolean;
}

export default function StudentPracticePage() {
  const router = useRouter();

  const [tests, setTests] = useState<TimedTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [startingTest, setStartingTest] = useState<string | null>(null);

  // Fetch available timed tests
  

const fetchTimedTests = useCallback(async () => {
  try {
    const token = localStorage.getItem("commerceHubToken");

    if (!token) {
      setError("Please log in to view available tests.");
      setLoading(false);
      return;
    }

    const response = await fetch(
      `${API_URL}/api/student-timed-tests`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Unable to load timed tests."
      );
    }

    setTests(result.data || []);
    setError("");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong while loading tests."
    );
  } finally {
    setLoading(false);
  }
}, []);



useEffect(() => {
  let isMounted = true;

  const loadTests = async () => {
    try {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        if (isMounted) {
          setError("Please log in to view available tests.");
          setLoading(false);
        }
        return;
      }

      const response = await fetch(
        `${API_URL}/api/student-timed-tests`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load timed tests."
        );
      }

      if (isMounted) {
        setTests(result.data || []);
        setError("");
      }
    } catch (err) {
      if (isMounted) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading tests."
        );
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadTests();

  return () => {
    isMounted = false;
  };
}, []);


  // Navigate to test instructions
  const handleStartTest = (testId: string) => {
    setStartingTest(testId);

  router.push(`/student/practice/instructions/${testId}`);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="mt-4 text-sm text-gray-500">
            Loading available examinations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">

      {/* Page Heading */}
      <div>
        <p className="text-sm font-medium text-blue-600">
          Student Examination Desk
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Timed Practice Tests
        </h1>

        <p className="mt-2 text-sm text-gray-500 sm:text-base">
          Prepare for your examinations by attempting timed tests
          created by your teachers.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Available Tests
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            {tests.length}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Your Examination
          </p>

          <h2 className="mt-2 text-lg font-bold text-gray-900">
            Board Based
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Test Mode
          </p>

          <h2 className="mt-2 text-lg font-bold text-gray-900">
            Timed Assessment
          </h2>
        </div>

      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchTimedTests}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Available Tests */}
      {!error && (
        <section>

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Available Examinations
            </h2>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {tests.length} Tests
            </span>
          </div>

          {tests.length === 0 ? (

            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">

              <div className="text-4xl">📝</div>

              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                No Tests Available
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                There are currently no active examinations for your
                class and board. Please check again later.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              {tests.map((test) => (

                <div
                  key={test._id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
                >

                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                      📚
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Active
                    </span>

                  </div>

                  {/* Test Details */}
                  <h3 className="mt-5 text-xl font-bold text-gray-900">
                    {test.title}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm text-gray-500">
                    {test.description || "Timed practice examination"}
                  </p>

                  {/* Subject and Board */}
                  <div className="mt-4 flex flex-wrap gap-2">

                    <span className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {test.subject?.name || "Subject"}
                    </span>

                    <span className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {test.board}
                    </span>

                    <span className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                      Class {test.courseLevel}
                    </span>

                  </div>

                  {/* Test Statistics */}
                  <div className="my-5 grid grid-cols-3 gap-2 border-y border-gray-100 py-4">

                    <div>
                      <p className="text-xs text-gray-500">
                        Duration
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-800">
                        {test.durationMinutes} min
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Questions
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-800">
                        {test.totalQuestions}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Total Marks
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-800">
                        {test.totalMarks}
                      </p>
                    </div>

                  </div>

                  {/* Start Button */}
                  <button
                    type="button"
                    onClick={() => handleStartTest(test._id)}
                    disabled={startingTest === test._id}
                    className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {startingTest === test._id
                      ? "Opening..."
                      : "Start Test →"}
                  </button>

                </div>

              ))}

            </div>

          )}

        </section>
      )}

    </div>
  );
}
