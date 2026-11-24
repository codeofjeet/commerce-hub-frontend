
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface StudentInfo {
  name?: string;
  email?: string;
}

interface SubjectInfo {
  _id: string;
  name: string;
}

interface ChapterInfo {
  _id: string;
  title: string;
  chapterNumber: number;
}

interface Submission {
  _id: string;
  questionText: string;
  board: string;
  courseLevel: string;
  status: "pending" | "in_review" | "answered" | "rejected";
  student?: StudentInfo;
  subject?: SubjectInfo;
  chapter?: ChapterInfo;
  createdAt?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function TeacherQuestionsPage() {
  const [questions, setQuestions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchQuestions = useCallback(async () => {
  await Promise.resolve();

  try {
    const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        await Promise.resolve();
        throw new Error("Please login to access teacher questions.");
      }

      const response = await fetch(
        `${API_URL}/api/question-submissions/teacher`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to fetch student questions."
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Invalid response received from server.");
      }

      setQuestions(result.data);
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
  const token = localStorage.getItem("commerceHubToken");

  if (!token) {
    Promise.resolve().then(() => {
      setError("Please login to access teacher questions.");
      setLoading(false);
    });
    return;
  }

  fetch(`${API_URL}/api/question-submissions/teacher`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then(async (response) => {
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to fetch student questions."
        );
      }

      return result;
    })
    .then((result) => {
      if (!Array.isArray(result.data)) {
        throw new Error("Invalid response received from server.");
      }

      setQuestions(result.data);
    })
    .catch((err: unknown) => {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

  const filteredQuestions = questions.filter((question) => {
    return filter === "all" || question.status === filter;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "in_review":
        return "bg-blue-100 text-blue-700";
      case "answered":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">
            Loading student questions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Page Heading */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Student Questions
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Review questions submitted by students in your assigned subjects.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void fetchQuestions();
          }}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Questions",
            value: questions.length,
          },
          {
            label: "Pending",
            value: questions.filter((q) => q.status === "pending").length,
          },
          {
            label: "In Review",
            value: questions.filter((q) => q.status === "in_review").length,
          },
          {
            label: "Answered",
            value: questions.filter((q) => q.status === "answered").length,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <h3 className="mt-3 text-3xl font-bold text-slate-800">
              {item.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Question List Heading and Filter */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-800">
          Submitted Questions
        </h3>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="all">All Questions</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="answered">Answered</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mb-3 text-4xl">📭</div>

            <h3 className="font-semibold text-slate-800">
              No questions found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              There are no questions available for this filter.
            </p>
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question._id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    {question.subject?.name || "Subject"}
                  </p>

                  <h3 className="mt-2 text-base font-semibold leading-7 text-slate-800">
                    {question.questionText}
                  </h3>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                    question.status
                  )}`}
                >
                  {question.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-400">Student</p>
                  <p className="mt-1 font-medium text-slate-700">
                    {question.student?.name || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Board / Class</p>
                  <p className="mt-1 font-medium text-slate-700">
                    {question.board} / {question.courseLevel}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Chapter</p>
                  <p className="mt-1 font-medium text-slate-700">
                    {question.chapter?.title || "Not assigned"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Submitted On</p>
                  <p className="mt-1 font-medium text-slate-700">
                    {question.createdAt
                      ? new Date(question.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {question.status === "pending" && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-amber-700">
                    This question is waiting for your review.
                  </p>
                </div>
              )}

              {question.status === "in_review" && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-blue-700">
                    Your answer is awaiting admin verification.
                  </p>
                </div>
              )}

              {question.status === "answered" && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-green-700">
                    This question has been answered and published.
                  </p>
                </div>
              )}

              {(question.status === "pending" ||
  question.status === "in_review") && (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

    {!question.chapter ? (
      <p className="text-sm text-amber-700">
        Waiting for admin to assign a chapter.
      </p>
    ) : (
      <p className="text-sm text-green-700">
        Chapter assigned. You can now write your answer.
      </p>
    )}

    {question.chapter && (
      <Link
        href={`/teacher/questions/${question._id}`}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {question.status === "in_review"
          ? "Edit My Answer →"
          : "Write Answer →"}
      </Link>
    )}

  </div>
)}

            </div>
          ))
        )}
      </div>
    </div>
  );
}
