
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface TimedTest {
  _id: string;
  title: string;
  description?: string;
  subject?: {
    _id: string;
    name: string;
  };
  board: string;
  courseLevel: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  chapters?: {
    _id: string;
    title: string;
    chapterNumber: number;
  }[];
}

function InstructionsContent() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();

  const testId = params.testId;

  const [test, setTest] = useState<TimedTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // Fetch selected test details
  useEffect(() => {
    let cancelled = false;

    const fetchTestDetails = async () => {
      try {
        const token = localStorage.getItem("commerceHubToken");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/timed-tests/student/${testId}`,
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

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load test details."
          );
        }

        setTest(result.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchTestDetails();

    return () => {
      cancelled = true;
    };
  }, [testId, router]);

  // Start examination
  const handleBeginExamination = async () => {
    if (!accepted || starting) return;

    setStarting(true);
    setError("");

    try {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/student-timed-tests/${testId}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("commerceHubToken");
        localStorage.removeItem("commerceHubUser");
        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !result.success ||
        !result.data?.attemptId
      ) {
        throw new Error(
          result.message || "Unable to start the examination."
        );
      }

      // Navigate to examination page
      router.push(
        `/student/practice/exam/${result.data.attemptId}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while starting the examination."
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="mt-4 text-sm text-gray-500">
            Loading examination instructions...
          </p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-red-700">
          Unable to Load Test
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error || "Test details could not be found."}
        </p>

        <button
          type="button"
          onClick={() => router.push("/student/timed-tests")}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/student/timed-tests")}
          className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Timed Tests
        </button>

        <p className="text-sm font-semibold text-blue-600">
          Student Examination Desk
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Examination Instructions
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Read all instructions carefully before starting your examination.
        </p>
      </div>

      {/* Test Details */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {test.board} | Class {test.courseLevel}
            </span>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {test.title}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {test.description || "Timed practice examination"}
            </p>

            <p className="mt-3 text-sm font-medium text-gray-700">
              Subject: {test.subject?.name || "Not specified"}
            </p>
          </div>

          <div className="rounded-xl bg-green-50 px-4 py-3 text-center">
            <span className="text-xs font-semibold text-green-700">
              Examination Status
            </span>

            <p className="mt-1 font-bold text-green-800">
              Ready to Start
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Duration</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {test.durationMinutes} Minutes
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total Questions</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {test.totalQuestions}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total Marks</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {test.totalMarks}
            </p>
          </div>
        </div>
      </div>

      {/* Chapters */}
      {test.chapters && test.chapters.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">
            Included Chapters
          </h3>

          <div className="mt-4 space-y-3">
            {test.chapters.map((chapter) => (
              <div
                key={chapter._id}
                className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                  {chapter.chapterNumber}
                </span>

                <p className="text-sm font-medium text-gray-800">
                  {chapter.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examination Rules */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">
          Important Examination Instructions
        </h3>

        <div className="mt-5 space-y-4">
          {[
            "The examination timer will start as soon as you begin the test.",
            "You must complete the examination within the allotted time.",
            "You can move between questions and update your answers before submission.",
            "Your saved answers will be used when you submit the examination.",
            "MCQ answers will be evaluated automatically.",
            "Written answers will be sent to the teacher for evaluation.",
            "Once submitted, you cannot change your answers.",
            "If the time expires, your examination will be automatically submitted.",
          ].map((instruction, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                {index + 1}
              </span>

              <p className="text-sm leading-6 text-gray-600">
                {instruction}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 accent-blue-600"
          />

          <span className="text-sm font-medium leading-6 text-gray-800">
            I have read and understood all the examination instructions.
            I am ready to begin this examination.
          </span>
        </label>
      </div>

      {/* Start Examination */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/student/timed-tests")}
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={!accepted || starting}
          onClick={handleBeginExamination}
          className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? "Starting Examination..." : "Begin Examination →"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          {error}
        </div>
      )}

    </div>
  );
}

export default function TestInstructionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          Loading instructions...
        </div>
      }
    >
      <InstructionsContent />
    </Suspense>
  );
}
