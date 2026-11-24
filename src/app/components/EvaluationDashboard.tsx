
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Question {
  _id: string;
  questionText: string;
  questionType: string;
  marks: number;
}

interface Attempt {
  _id: string;
  board: string;
  courseLevel: string;
  status: string;
  subject?: string;
  chapter?: string;
}

interface StudentResponse {
  _id: string;
  student: Student;
  question: Question;
  attempt: Attempt;
  responseText: string;
  selectedOptionIndex: number | null;
  marksAwarded: number;
  evaluationStatus: string;
  feedback: string;
  submittedAt: string;
}

interface VerifiedAnswer {
  answerText: string;
  explanation: string;
}

export default function EvaluationDashboard() {
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [selectedResponse, setSelectedResponse] =
    useState<StudentResponse | null>(null);

  const [verifiedAnswer, setVerifiedAnswer] =
    useState<VerifiedAnswer | null>(null);

  const [marks, setMarks] = useState("0");
  const [feedback, setFeedback] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("commerceHubToken") || "";
  };

  // Fetch pending evaluations
  

const fetchPendingEvaluations = useCallback(async () => {
  try {
    const token = getToken();

    if (!token) {
      throw new Error("Please login to access evaluations.");
    }

    const response = await fetch(
      `${API_URL}/api/evaluations/pending`,
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
        result.message || "Unable to load pending evaluations."
      );
    }

    setResponses(result.data || []);
    setError("");
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
  const loadEvaluations = async () => {
    await fetchPendingEvaluations();
  };

  void loadEvaluations();
}, [fetchPendingEvaluations]);

  // Load individual evaluation details
  const handleViewEvaluation = async (
    item: StudentResponse
  ) => {
    try {
      setDetailsLoading(true);
      setError("");
      setSuccess("");

      setSelectedResponse(null);
      setVerifiedAnswer(null);

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/evaluations/${item._id}`,
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
          result.message || "Unable to load evaluation details."
        );
      }

      setSelectedResponse(result.data.response);
      setVerifiedAnswer(result.data.verifiedAnswer || null);

      setMarks("0");
      setFeedback("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load evaluation."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // Submit teacher evaluation
  const handleSubmitEvaluation = async () => {
    if (!selectedResponse) return;

    const awardedMarks = Number(marks);
    const maximumMarks = selectedResponse.question.marks;

    if (
      marks.trim() === "" ||
      !Number.isFinite(awardedMarks) ||
      awardedMarks < 0 ||
      awardedMarks > maximumMarks
    ) {
      setError(
        `Please enter marks between 0 and ${maximumMarks}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/evaluations/${selectedResponse._id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            marksAwarded: awardedMarks,
            feedback: feedback.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Evaluation submission failed."
        );
      }

      setSuccess("Student answer evaluated successfully!");

      setSelectedResponse(null);
      setVerifiedAnswer(null);
      setMarks("0");
      setFeedback("");

      await fetchPendingEvaluations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit evaluation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Commerce Hub Kota
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Answer Evaluation
            </h1>

            <p className="mt-2 text-slate-600">
              Review student answers and award marks with feedback.
            </p>
          </div>

          <button
            onClick={fetchPendingEvaluations}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Pending Evaluations
            </p>

            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              {responses.length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Evaluation Status
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-800">
              {responses.length > 0
                ? "Action Required"
                : "All Caught Up"}
            </h2>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Evaluation Details */}
        {selectedResponse && (
          <section className="mb-8 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Evaluate Student Answer
              </h2>

              <button
                onClick={() => {
                  setSelectedResponse(null);
                  setVerifiedAnswer(null);
                  setError("");
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {/* Student information */}
            <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Student
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedResponse.student?.name}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedResponse.student?.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Board / Class
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedResponse.attempt?.board} / Class{" "}
                  {selectedResponse.attempt?.courseLevel}
                </p>
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-blue-600">
                QUESTION
              </p>

              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                {selectedResponse.question?.questionText}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Type: {selectedResponse.question?.questionType}
                {" · "}
                Maximum Marks: {selectedResponse.question?.marks}
              </p>
            </div>

            {/* Student Answer */}
            <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50 p-5">
              <h3 className="mb-3 font-bold text-orange-800">
                Student&apos;s Answer
              </h3>

              <p className="whitespace-pre-wrap leading-7 text-slate-800">
                {selectedResponse.responseText || "No written answer provided."}
              </p>
            </div>

            {/* Verified Answer */}
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
              <h3 className="mb-3 font-bold text-green-800">
                Verified Answer
              </h3>

              {verifiedAnswer ? (
                <>
                  <p className="whitespace-pre-wrap leading-7 text-slate-800">
                    {verifiedAnswer.answerText}
                  </p>

                  {verifiedAnswer.explanation && (
                    <div className="mt-4 border-t border-green-200 pt-4">
                      <p className="mb-2 text-sm font-semibold text-green-800">
                        Explanation
                      </p>

                      <p className="whitespace-pre-wrap leading-7 text-slate-700">
                        {verifiedAnswer.explanation}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-600">
                  No verified answer is available.
                </p>
              )}
            </div>

            {/* Marks and Feedback */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Marks Awarded
                </label>

                <input
                  type="number"
                  min="0"
                  max={selectedResponse.question?.marks || 0}
                  step="0.5"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Maximum marks: {selectedResponse.question?.marks}
                </p>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Teacher Feedback
                </label>

                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write feedback for the student..."
                  className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              onClick={handleSubmitEvaluation}
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting
                ? "Submitting..."
                : "Submit Evaluation"}
            </button>
          </section>
        )}

        {/* Pending Answers */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-bold text-slate-900">
              Pending Student Answers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select an answer to review and evaluate.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading pending evaluations...
            </div>
          ) : responses.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-slate-800">
                No pending evaluations
              </p>

              <p className="mt-2 text-sm text-slate-500">
                All submitted answers have been reviewed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {responses.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50 md:flex-row md:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        Pending Review
                      </span>

                      <span className="text-xs text-slate-500">
                        {item.question?.questionType}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-900">
                      {item.question?.questionText}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      Student: {item.student?.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {item.student?.email}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Maximum Marks: {item.question?.marks}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Submitted:{" "}
                      {new Date(item.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleViewEvaluation(item)}
                    disabled={detailsLoading}
                    className="shrink-0 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Review Answer →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
