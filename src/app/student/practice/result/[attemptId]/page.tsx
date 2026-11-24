
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ResultResponse {
  success: boolean;
  data: {
    attempt: {
      _id: string;
      totalQuestions: number;
      totalMarks: number;
      marksObtained: number;
      answeredQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      status: string;
      startedAt: string;
      submittedAt?: string;
      evaluatedAt?: string | null;
    };
    test: {
      _id: string;
      title: string;
      subject: string;
      board: string;
      courseLevel: string;
    };
    pendingEvaluation: number;
    responses: {
      _id: string;
      question: {
        _id: string;
        questionText: string;
        questionType: string;
        options?: string[];
        marks: number;
      };
      responseText: string;
      selectedOptionIndex: number | null;
      evaluationStatus: string;
      isCorrect: boolean | null;
      marksAwarded: number;
      feedback: string;
      evaluatedAt?: string | null;
    }[];
  };
  message?: string;
}

function TimedTestResultContent() {
  const params = useParams();
  const router = useRouter();

  const attemptId = params.attemptId as string;

  const [result, setResult] = useState<ResultResponse["data"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("commerceHubToken");

        if (!token) {
          throw new Error("Please log in to view your result.");
        }

        const response = await fetch(
          `${API_URL}/api/student-timed-tests/attempts/${attemptId}/result`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        const data: ResultResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load examination result."
          );
        }

        if (isMounted) {
          setResult(data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchResult();

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">
            Loading your examination result...
          </p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-red-700">
          Unable to Load Result
        </h2>

        <p className="mt-2 text-sm text-red-600">
          {error || "Result information is unavailable."}
        </p>

        <button
          onClick={() => router.push("/student/practice")}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Timed Tests
        </button>
      </div>
    );
  }

  const { attempt, test, responses, pendingEvaluation } = result;

  const percentage =
    attempt.totalMarks > 0
      ? Math.round(
          (attempt.marksObtained / attempt.totalMarks) * 100
        )
      : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Page Heading */}
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Student Examination Desk
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Examination Result
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Review your examination performance and answer evaluation.
        </p>
      </div>

      {/* Test Information */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {test.board} | Class {test.courseLevel}
            </span>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {test.title}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Attempt ID: {attempt._id}
            </p>
          </div>

          <div className="h-fit rounded-xl bg-green-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-green-700">
              Examination Status
            </p>
            <p className="mt-1 font-bold text-green-800">
              {attempt.status.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Started At</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {formatDate(attempt.startedAt)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Submitted At</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {formatDate(attempt.submittedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Marks Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Marks Obtained</p>
          <h3 className="mt-2 text-2xl font-bold text-blue-700">
            {attempt.marksObtained} / {attempt.totalMarks}
          </h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Percentage</p>
          <h3 className="mt-2 text-2xl font-bold text-gray-900">
            {percentage}%
          </h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Correct Answers</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {attempt.correctAnswers}
          </h3>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Incorrect Answers</p>
          <h3 className="mt-2 text-2xl font-bold text-red-600">
            {attempt.incorrectAnswers}
          </h3>
        </div>

      </div>

      {/* Answer Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Answer Summary
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total Questions</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {attempt.totalQuestions}
            </p>
          </div>

          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-sm text-gray-500">Answered</p>
            <p className="mt-1 text-xl font-bold text-green-700">
              {attempt.answeredQuestions}
            </p>
          </div>

          <div className="rounded-xl bg-orange-50 p-4">
            <p className="text-sm text-gray-500">Pending Evaluation</p>
            <p className="mt-1 text-xl font-bold text-orange-700">
              {pendingEvaluation}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Evaluation Notice */}
      {pendingEvaluation > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <h3 className="font-bold text-orange-800">
            Teacher Evaluation Pending
          </h3>

          <p className="mt-2 text-sm leading-6 text-orange-700">
            You have {pendingEvaluation} written answer(s) waiting for
            teacher evaluation. Your final marks may change after
            your teacher evaluates these answers.
          </p>
        </div>
      )}

      {/* Question-wise Review */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Question-wise Answer Review
        </h2>

        {responses.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            No answer details are available.
          </div>
        ) : (
          responses.map((item, index) => (
            <div
              key={item._id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold text-gray-900">
                  Question {index + 1}
                </span>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {item.question.questionType}
                </span>
              </div>

              <h3 className="mt-4 text-sm font-semibold leading-7 text-gray-800">
                {item.question.questionText}
              </h3>

              {item.question.questionType === "MCQ" &&
              item.selectedOptionIndex !== null ? (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Your selected answer
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {item.question.options?.[
                      item.selectedOptionIndex
                    ] || "Selected option"}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Your written answer
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-800">
                    {item.responseText || "Not answered"}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Evaluation Status
                  </p>

                  <p
                    className={`mt-1 text-sm font-semibold ${
                      item.evaluationStatus === "pending_review"
                        ? "text-orange-600"
                        : item.isCorrect
                          ? "text-green-600"
                          : item.evaluationStatus === "auto_evaluated" ||
                              item.evaluationStatus === "reviewed"
                            ? "text-red-600"
                            : "text-gray-600"
                    }`}
                  >
                    {item.evaluationStatus.replace("_", " ").toUpperCase()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Marks Awarded</p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {item.marksAwarded} / {item.question.marks}
                  </p>
                </div>
              </div>

              {item.feedback && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">
                    Teacher Feedback
                  </p>

                  <p className="mt-2 text-sm text-gray-700">
                    {item.feedback}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => router.push("/student/practice")}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to Timed Tests
        </button>

        <button
          onClick={() => router.push("/student/results")}
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          View My Results
        </button>
      </div>

    </div>
  );
}

export default function TimedTestResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          Loading examination result...
        </div>
      }
    >
      <TimedTestResultContent />
    </Suspense>
  );
}
