
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Submission {
  _id: string;
  questionText: string;
  board: string;
  courseLevel: string;
  status: string;
  createdAt: string;
  adminNotes?: string;

  student?: {
    name: string;
    email: string;
  };

  subject?: {
    name: string;
  };

  chapter?: {
    title: string;
    chapterNumber: number;
  };

  draftQuestion?: string;

  answer?: {
    answerText: string;
    explanation: string;
    isVerified: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
}

export default function AdminAnswerVerificationPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [verifyingId, setVerifyingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");

  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const [adminNotes, setAdminNotes] = useState("");

  const fetchSubmissions = useCallback(async () => {
  try {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please login as admin.");
      }

      const response = await fetch(
        `${API_URL}/api/question-submissions`,
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
          result.message || "Unable to fetch submissions."
        );
      }

      setSubmissions(result.data || []);
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
  let cancelled = false;

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please login as admin.");
      }

      const response = await fetch(
        `${API_URL}/api/question-submissions`,
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
          result.message || "Unable to fetch submissions."
        );
      }

      if (!cancelled) {
        setSubmissions(result.data || []);
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
  };

  void loadSubmissions();

  return () => {
    cancelled = true;
  };
}, []);

  // Only answers awaiting admin verification.
  const pendingAnswers = submissions.filter(
    (item) =>
      item.status === "in_review" &&
      item.draftQuestion &&
      item.answer &&
      !item.answer.isVerified
  );

  const verifiedAnswers = submissions.filter(
    (item) => item.answer?.isVerified === true
  );

  const rejectedAnswers = submissions.filter(
    (item) => item.status === "rejected"
  );

  // Verify and publish answer.
  const handleVerify = async (submissionId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to verify this answer and publish the question?"
    );

    if (!confirmed) return;

    try {
      setVerifyingId(submissionId);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please login as admin.");
      }

      const response = await fetch(
        `${API_URL}/api/question-submissions/${submissionId}/verify`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Answer verification failed."
        );
      }

      setSuccess(
        "Answer verified and question published successfully."
      );

      await fetchSubmissions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify answer."
      );
    } finally {
      setVerifyingId("");
    }
  };

  // Open rejection form.
  const openRejectForm = (item: Submission) => {
    setSelectedSubmission(item);
    setAdminNotes("");
    setError("");
    setSuccess("");
  };

  // Reject answer and send feedback to teacher.
  const handleReject = async () => {
    if (!selectedSubmission) return;

    if (!adminNotes.trim()) {
      setError("Please enter feedback before rejecting the answer.");
      return;
    }

    if (adminNotes.trim().length > 3000) {
      setError("Feedback cannot exceed 3000 characters.");
      return;
    }

    try {
      setRejectingId(selectedSubmission._id);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please login as admin.");
      }

      const response = await fetch(
        `${API_URL}/api/question-submissions/${selectedSubmission._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "rejected",
            adminNotes: adminNotes.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to reject answer."
        );
      }

      setSelectedSubmission(null);
      setAdminNotes("");

      setSuccess(
        "Answer rejected successfully. Feedback has been sent to the teacher."
      );

      await fetchSubmissions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reject answer."
      );
    } finally {
      setRejectingId("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Commerce Hub Kota
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Answer Verification
          </h1>

          <p className="mt-2 text-slate-500">
            Review teacher answers before publishing them for students.
          </p>
        </div>

        <button
  onClick={() => {
    setError("");
    setLoading(true);
    void fetchSubmissions();
  }}
  disabled={loading}
  className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
>
  {loading ? "Refreshing..." : "↻ Refresh"}
</button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Submissions
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            {submissions.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Pending Verification
          </p>
          <h2 className="mt-3 text-3xl font-bold text-orange-600">
            {pendingAnswers.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Verified Answers
          </p>
          <h2 className="mt-3 text-3xl font-bold text-green-600">
            {verifiedAnswers.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Rejected Answers
          </p>
          <h2 className="mt-3 text-3xl font-bold text-red-600">
            {rejectedAnswers.length}
          </h2>
        </div>
      </div>

      {/* Pending Answers */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            Pending Teacher Answers
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review the answer and publish it after verification.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading submissions...
          </div>
        ) : pendingAnswers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">✓</div>

            <h3 className="mt-4 font-semibold text-slate-800">
              No pending answers
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              All available teacher answers have been reviewed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingAnswers.map((item) => (
              <article key={item._id} className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold uppercase text-blue-600">
                    {item.subject?.name || "Subject"}
                  </span>

                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    Pending Verification
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-900">
                  {item.questionText}
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-4 border-y border-slate-100 py-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">
                      Student
                    </p>
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
                    <p className="text-xs text-slate-400">
                      Chapter
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {item.chapter?.title || "Not assigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Submitted
                    </p>
                    <p className="mt-1 font-medium text-slate-700">
                      {new Date(item.answer?.updatedAt || item.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Teacher Answer */}
                {item.answer && (
                  <div className="mt-5 rounded-lg bg-slate-50 p-5">
                    <h4 className="font-semibold text-slate-900">
                      Teachers Answer
                    </h4>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {item.answer.answerText}
                    </p>

                    {item.answer.explanation && (
                      <>
                        <h4 className="mt-5 font-semibold text-slate-900">
                          Explanation
                        </h4>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                          {item.answer.explanation}
                        </p>
                      </>
                    )}

                    {item.answer.updatedAt && (
                      <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-400">
                        Last updated:{" "}
                        {new Date(item.answer.updatedAt).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-orange-600">
                    Review this answer before publishing.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => openRejectForm(item)}
                      disabled={
                        verifyingId === item._id ||
                        rejectingId === item._id
                      }
                      className="rounded-lg border border-red-300 bg-white px-5 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject Answer
                    </button>

                    <button
                      onClick={() => handleVerify(item._id)}
                      disabled={
                        verifyingId === item._id ||
                        rejectingId === item._id
                      }
                      className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verifyingId === item._id
                        ? "Verifying..."
                        : "✓ Verify & Publish"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Rejection Form */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Reject Teacher Answer
              </h2>

              <button
                type="button"
                onClick={() => {
                  setSelectedSubmission(null);
                  setAdminNotes("");
                  setError("");
                }}
                className="text-2xl text-slate-400 hover:text-slate-700"
                aria-label="Close rejection form"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Question:{" "}
              <span className="font-semibold text-slate-800">
                {selectedSubmission.questionText}
              </span>
            </p>

            <div className="mt-5">
              <label
                htmlFor="adminNotes"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Rejection Feedback *
              </label>

              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain what the teacher needs to improve. For example: Please add a suitable example and provide a more detailed explanation."
                rows={6}
                maxLength={3000}
                className="w-full rounded-lg border border-slate-300 p-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {adminNotes.length}/3000 characters
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubmission(null);
                  setAdminNotes("");
                  setError("");
                }}
                disabled={rejectingId === selectedSubmission._id}
                className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={
                  rejectingId === selectedSubmission._id ||
                  !adminNotes.trim()
                }
                className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rejectingId === selectedSubmission._id
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
