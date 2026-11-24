
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface TeacherAnswer {
  _id: string;
  questionText: string;
  board: string;
  courseLevel: string;
  status: string;
  adminNotes?: string;
  createdAt: string;

  subject?: {
    name: string;
  };

  chapter?: {
    title: string;
    chapterNumber: number;
  };

  student?: {
    name: string;
    email: string;
  };

  answer?: {
    answerText: string;
    explanation: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export default function TeacherMyAnswersPage() {
  const [answers, setAnswers] = useState<TeacherAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchAnswers = async () => {
      try {
        const token = localStorage.getItem("commerceHubToken");

        if (!token) {
          throw new Error("Please login to access your answers.");
        }

        const response = await fetch(
          `${API_URL}/api/question-submissions/teacher/my-answers`,
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

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to fetch your answers."
          );
        }

        if (active) {
          setAnswers(result.data || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchAnswers();

    return () => {
      active = false;
    };
  }, []);

  const totalAnswers = answers.filter(
    (item) => item.answer
  ).length;

  const verifiedAnswers = answers.filter(
    (item) => item.answer?.isVerified === true
  ).length;

  const rejectedAnswers = answers.filter(
    (item) => item.status === "rejected"
  ).length;

  const pendingAnswers = answers.filter(
    (item) => item.status === "in_review"
  ).length;

  const getStatusStyle = (item: TeacherAnswer) => {
    if (item.status === "rejected") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (item.answer?.isVerified) {
      return "bg-green-100 text-green-700";
    }

    if (item.status === "in_review") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  const getStatusLabel = (item: TeacherAnswer) => {
    if (item.status === "rejected") return "Rejected";
    if (item.answer?.isVerified) return "Verified";
    if (item.status === "in_review") return "Awaiting Verification";

    return item.status.replace("_", " ");
  };

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Commerce Hub Kota
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          My Answers
        </h1>

        <p className="mt-2 text-slate-500">
          View your submitted answers and admin verification status.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Answers</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            {totalAnswers}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Awaiting Verification
          </p>
          <h2 className="mt-3 text-3xl font-bold text-orange-600">
            {pendingAnswers}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Verified Answers</p>
          <h2 className="mt-3 text-3xl font-bold text-green-600">
            {verifiedAnswers}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Rejected Answers</p>
          <h2 className="mt-3 text-3xl font-bold text-red-600">
            {rejectedAnswers}
          </h2>
        </div>
      </div>

      {/* Answers List */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Submitted Answers
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            All answers prepared by you for student questions.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading your answers...
          </div>
        ) : answers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">📝</div>

            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              No answers submitted yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Your submitted answers will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {answers.map((item) => (
              <article key={item._id} className="p-6">
                {/* Subject and Status */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold uppercase text-blue-600">
                    {item.subject?.name || "Subject"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      item
                    )}`}
                  >
                    {getStatusLabel(item)}
                  </span>
                </div>

                {/* Question */}
                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {item.questionText}
                </h3>

                {/* Question Details */}
                <div className="mt-4 grid grid-cols-1 gap-4 border-y border-slate-100 py-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">Student</p>
                    <p className="mt-1 font-medium text-slate-700">
                      {item.student?.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Board / Class
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {item.board} / {item.courseLevel}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Chapter</p>
                    <p className="mt-1 font-medium text-slate-700">
                      {item.chapter
                        ? `${item.chapter.chapterNumber}. ${item.chapter.title}`
                        : "Not assigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Submitted On
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {new Date(item.createdAt).toLocaleDateString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>

                {/* Answer Details */}
                {item.answer ? (
                  <div className="mt-5 rounded-lg bg-slate-50 p-5">
                    <h4 className="font-semibold text-slate-800">
                      Your Answer
                    </h4>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {item.answer.answerText}
                    </p>

                    {item.answer.explanation && (
                      <>
                        <h4 className="mt-5 font-semibold text-slate-800">
                          Explanation
                        </h4>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                          {item.answer.explanation}
                        </p>
                      </>
                    )}

                    <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
                      {item.status === "rejected" ? (
                        <p className="font-medium text-red-700">
                          Your answer was rejected. Please review the
                          administrators feedback below.
                        </p>
                      ) : item.answer.isVerified ? (
                        <p className="font-medium text-green-700">
                          ✓ Your answer has been verified and published.
                        </p>
                      ) : (
                        <p className="font-medium text-blue-700">
                          Your answer is awaiting admin verification.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-orange-600">
                    No answer details are available for this submission.
                  </p>
                )}

                {/* Admin Rejection Feedback */}
                {item.status === "rejected" && (
                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚠️</span>

                      <h4 className="font-bold text-red-800">
                        Admin Rejection Feedback
                      </h4>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-red-700">
                      {item.adminNotes ||
                        "The administrator has rejected your answer. Please improve it and submit again."}
                    </p>
                  </div>
                )}

                {/* Edit and Resubmit Button */}
                {item.status === "rejected" && (
                  <div className="mt-5 flex flex-wrap justify-end">
                    <Link
                      href={`/teacher/questions/${item._id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Edit & Resubmit Answer
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
