
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PendingResponse {
  _id: string;
  responseText: string;
  marksAwarded: number;
  evaluationStatus: string;
  feedback: string;
  createdAt: string;
  question: {
    _id: string;
    questionText: string;
    questionType: string;
    marks: number;
    options?: string[];
  };
  attempt: {
    _id: string;
    student: {
      _id: string;
      name: string;
      email: string;
    };
    test: {
      _id: string;
      title: string;
      subject: {
        _id: string;
        name: string;
      };
      board: string;
      courseLevel: string;
    };
    submittedAt: string;
    totalMarks: number;
  };
}

export default function TeacherTimedTestsPage() {
  const [responses, setResponses] = useState<PendingResponse[]>([]);
  const [selectedResponse, setSelectedResponse] =
    useState<PendingResponse | null>(null);

  const [marks, setMarks] = useState("0");
  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPendingAnswers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please log in using your teacher account.");
      }

      const response = await fetch(
        `${API_URL}/api/teacher-timed-tests/pending`,
        {
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
          result.message || "Unable to load pending answers."
        );
      }

      setResponses(result.data || []);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  const timer = window.setTimeout(() => {
    fetchPendingAnswers();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, [fetchPendingAnswers]);

  const handleSelectResponse = (item: PendingResponse) => {
    setSelectedResponse(item);
    setMarks("0");
    setFeedback("");
    setSuccess("");
    setError("");
  };

  const handleEvaluate = async () => {
    if (!selectedResponse) return;

    const marksValue = Number(marks);

    if (
      !Number.isFinite(marksValue) ||
      marks.trim() === "" ||
      marksValue < 0 ||
      marksValue > selectedResponse.question.marks
    ) {
      setError(
        `Enter marks between 0 and ${selectedResponse.question.marks}.`
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/api/teacher-timed-tests/${selectedResponse._id}/evaluate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            marksAwarded: marksValue,
            feedback: feedback.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to evaluate answer."
        );
      }

      setSuccess(
        `Answer evaluated successfully. Marks awarded: ${result.data.marksAwarded}/${result.data.maximumMarks}.`
      );

      setSelectedResponse(null);
      setMarks("0");
      setFeedback("");

      await fetchPendingAnswers();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit evaluation."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Teacher Examination Desk
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Timed Test Evaluation
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review student answers and evaluate their examination performance.
          </p>
        </div>

        <button
          onClick={fetchPendingAnswers}
          disabled={loading}
          className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm font-medium text-orange-700">
            Pending Answers
          </p>

          <h2 className="mt-2 text-3xl font-bold text-orange-800">
            {responses.length}
          </h2>

          <p className="mt-1 text-xs text-orange-600">
            Written answers awaiting evaluation
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-medium text-blue-700">
            Evaluation Module
          </p>

          <h2 className="mt-2 text-xl font-bold text-blue-800">
            Timed Examinations
          </h2>

          <p className="mt-1 text-xs text-blue-600">
            Evaluate answers from your assigned subjects
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

        {/* Pending Answers List */}
        <section className="space-y-4 xl:col-span-2">

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Pending Evaluations
            </h2>

            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
              {responses.length} Pending
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-3 text-sm text-gray-500">
                Loading pending answers...
              </p>
            </div>
          ) : responses.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <div className="text-4xl">✓</div>

              <h3 className="mt-3 font-bold text-gray-800">
                All Caught Up!
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                There are no pending written answers to evaluate.
              </p>
            </div>
          ) : (
            responses.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => handleSelectResponse(item)}
                className={`w-full rounded-xl border bg-white p-5 text-left transition hover:border-blue-400 hover:shadow-sm ${
                  selectedResponse?._id === item._id
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                    Pending Review
                  </span>

                  <span className="text-xs text-gray-400">
                    {item.question.marks} Marks
                  </span>
                </div>

                <h3 className="mt-4 font-bold text-gray-900">
                  {item.attempt.test.title}
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  {item.attempt.student.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {item.attempt.test.subject.name} ·{" "}
                  {item.attempt.test.board} · Class{" "}
                  {item.attempt.test.courseLevel}
                </p>

                <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                  {item.question.questionText}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">
                    {formatDate(item.attempt.submittedAt)}
                  </span>

                  <span className="text-xs font-bold text-blue-600">
                    Review Answer →
                  </span>
                </div>
              </button>
            ))
          )}
        </section>

        {/* Evaluation Panel */}
        <section className="xl:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

            {!selectedResponse ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                  📝
                </div>

                <h2 className="mt-5 text-lg font-bold text-gray-900">
                  Answer Evaluation
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  Select a pending answer from the list to review the
                  students response and award marks.
                </p>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Selected Student */}
                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    Student Information
                  </p>

                  <h2 className="mt-2 text-xl font-bold text-gray-900">
                    {selectedResponse.attempt.student.name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedResponse.attempt.student.email}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Examination
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {selectedResponse.attempt.test.title}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Subject
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {selectedResponse.attempt.test.subject.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-gray-900">
                      Question
                    </h3>

                    <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {selectedResponse.question.questionType}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium leading-7 text-gray-800">
                    {selectedResponse.question.questionText}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Maximum Marks: {selectedResponse.question.marks}
                  </p>
                </div>

                {/* Student Answer */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="font-bold text-gray-900">
                    Students Answer
                  </h3>

                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-5">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">
                      {selectedResponse.responseText || "No written answer provided."}
                    </p>
                  </div>
                </div>

                {/* Evaluation Form */}
                <div className="space-y-5 border-t border-gray-100 pt-5">
                  <h3 className="font-bold text-gray-900">
                    Evaluate Answer
                  </h3>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Marks Awarded
                    </label>

                    <input
                      type="number"
                      min="0"
                      max={selectedResponse.question.marks}
                      step="0.5"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Maximum allowed marks:{" "}
                      {selectedResponse.question.marks}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Teacher Feedback
                    </label>

                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Write feedback for the student..."
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedResponse(null)}
                      disabled={saving}
                      className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleEvaluate}
                      disabled={saving}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Submitting..." : "Submit Evaluation"}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
