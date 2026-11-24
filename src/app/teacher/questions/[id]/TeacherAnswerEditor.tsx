
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Answer {
  answerText: string;
  explanation: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Submission {
  _id: string;
  questionText: string;
  board: string;
  courseLevel: string;
  status: "pending" | "in_review" | "answered" | "rejected";
  adminNotes?: string;
  answer?: Answer | null;
  subject?: {
    _id: string;
    name: string;
  };
  chapter?: {
    _id: string;
    title: string;
    chapterNumber: number;
  };
  student?: {
    name: string;
    email: string;
  };
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function TeacherAnswerEditor({
  submissionId,
}: {
  submissionId: string;
}) {
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSubmission() {
      try {
        const token = localStorage.getItem("commerceHubToken");

        if (!token) {
          throw new Error("Please login using your teacher account.");
        }

        const response = await fetch(
          `${API_URL}/api/question-submissions/teacher`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Unable to load submission."
          );
        }

        if (!Array.isArray(result.data)) {
          throw new Error("Invalid server response.");
        }

        const selected = result.data.find(
          (item: Submission) => item._id === submissionId
        );

        if (!selected) {
          throw new Error(
            "Question not found or you are not authorized to access it."
          );
        }

        if (!cancelled) {
          setSubmission(selected);

          // Load the existing answer when editing a rejected
          // answer or viewing an already submitted answer.
          if (selected.answer) {
            setAnswerText(selected.answer.answerText || "");
            setExplanation(selected.answer.explanation || "");
          }
        }
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
    }

    void loadSubmission();

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!answerText.trim()) {
      setError("Please enter your answer.");
      return;
    }

    if (!submission?.chapter) {
      setError("A chapter must be assigned before submitting an answer.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please login again.");
      }

      const response = await fetch(
        `${API_URL}/api/question-submissions/${submissionId}/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answerText: answerText.trim(),
            explanation: explanation.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to submit answer."
        );
      }

      setSuccess(
        result.message ||
          "Answer submitted successfully for admin verification."
      );

      setTimeout(() => {
        router.push("/teacher/questions");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">Loading question...</p>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error}</p>

        <Link
          href="/teacher/questions"
          className="mt-4 inline-block font-semibold text-blue-600"
        >
          ← Back to Student Questions
        </Link>
      </div>
    );
  }

  if (!submission) return null;

  const isRejected = submission.status === "rejected";
  const isPending = submission.status === "pending";
  const isInReview = submission.status === "in_review";
  const isAnswered = submission.status === "answered";

  const canEdit = isPending || isRejected;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page Header */}
      <div className="mb-6">
        <Link
          href="/teacher/questions"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Student Questions
        </Link>

        <h2 className="mt-4 text-2xl font-bold text-slate-800">
          {isRejected
            ? "Edit Rejected Answer"
            : isPending
              ? "Write Answer"
              : "View Submitted Answer"}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {isRejected
            ? "Review the administrator's feedback and improve your answer."
            : isPending
              ? "Prepare your answer for admin verification."
              : "Review your previously submitted answer."}
        </p>
      </div>

      {/* Student Question */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          {submission.subject?.name || "Subject"}
        </p>

        <h3 className="mt-3 text-lg font-bold leading-7 text-slate-800">
          {submission.questionText}
        </h3>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Student</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {submission.student?.name || "Unknown"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Board</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {submission.board}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Class</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {submission.courseLevel}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Chapter</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {submission.chapter
                ? `${submission.chapter.chapterNumber}. ${submission.chapter.title}`
                : "Not assigned"}
            </p>
          </div>
        </div>
      </div>

      {/* Rejection Feedback */}
      {isRejected && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>

            <h3 className="font-bold text-red-800">
              Answer Rejected - Admin Feedback
            </h3>
          </div>

          <p className="mt-3 text-sm leading-6 text-red-700">
            {submission.adminNotes ||
              "The administrator has rejected your answer. Please review and improve it."}
          </p>

          <p className="mt-3 text-xs text-red-600">
            Please correct your answer according to this feedback
            before resubmitting.
          </p>
        </div>
      )}

      {/* Pending Chapter Warning */}
      {!submission.chapter && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-800">
            Chapter assignment required
          </h3>

          <p className="mt-2 text-sm text-amber-700">
            Please ask the administrator to assign a chapter before
            writing an answer.
          </p>
        </div>
      )}

      {/* In Review Information */}
      {isInReview && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="font-semibold text-blue-800">
            Answer Awaiting Admin Verification
          </h3>

          <p className="mt-2 text-sm text-blue-700">
            Your answer has been submitted successfully and is
            currently waiting for administrator verification.
          </p>
        </div>
      )}

      {/* Verified Answer Information */}
      {isAnswered && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
          <h3 className="font-semibold text-green-800">
            Answer Verified
          </h3>

          <p className="mt-2 text-sm text-green-700">
            Your answer has been verified by the administrator.
          </p>
        </div>
      )}

      {/* Answer Form / Read-only Answer */}
      {canEdit && submission.chapter ? (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="answer"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {isRejected ? "Improve Your Answer *" : "Your Answer *"}
            </label>

            <textarea
              id="answer"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Write a detailed answer for the student..."
              rows={8}
              maxLength={15000}
              required
              className="w-full rounded-lg border border-slate-300 p-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {answerText.length}/15000 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="explanation"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Explanation (Optional)
            </label>

            <textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Add examples or additional explanation..."
              rows={5}
              maxLength={15000}
              className="w-full rounded-lg border border-slate-300 p-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {explanation.length}/15000 characters
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <Link
              href="/teacher/questions"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || !answerText.trim()}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Submitting..."
                : isRejected
                  ? "Resubmit Improved Answer →"
                  : "Submit for Verification →"}
            </button>
          </div>
        </form>
      ) : submission.answer ? (
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="mb-3 font-semibold text-slate-800">
              Submitted Answer
            </h3>

            <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {submission.answer.answerText}
            </div>
          </div>

          {submission.answer.explanation && (
            <div>
              <h3 className="mb-3 font-semibold text-slate-800">
                Explanation
              </h3>

              <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                {submission.answer.explanation}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 text-sm text-slate-500">
            Answer Status:{" "}
            <span className="font-semibold text-slate-700">
              {isAnswered ? "Verified" : "Awaiting Verification"}
            </span>
          </div>

          <div className="flex justify-end">
            <Link
              href="/teacher/questions"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Student Questions
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-600">
            No answer is available for this submission.
          </p>

          <Link
            href="/teacher/questions"
            className="mt-4 inline-block font-semibold text-blue-600"
          >
            ← Back to Student Questions
          </Link>
        </div>
      )}
    </div>
  );
}
