
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Question {
  _id: string;
  questionText: string;
  questionType: string;
  options: string[];
  difficulty: string;
  marks: number;
}

interface PracticeData {
  attemptId: string;
  chapter: {
    _id: string;
    title: string;
    chapterNumber: number;
  };
  currentQuestionIndex: number;
  totalQuestions: number;
  progress: number;
  question: Question;
  alreadyAnswered: boolean;
}

interface VerifiedAnswer {
  _id: string;
  answerText: string;
  explanation?: string;
}

interface SubmissionData {
  questionType: string;
  isCorrect: boolean | null;
  evaluationStatus: string;
  marksAwarded: number;
  feedback: string;
  verifiedAnswer?: VerifiedAnswer;
}

interface ResultResponse {
  _id: string;
  question: {
    _id?: string;
    questionText: string;
    questionType?: string;
    marks: number;
  };
  responseText: string;
  selectedOptionIndex?: number | null;
  isCorrect: boolean | null;
  evaluationStatus: string;
  marksAwarded: number;
  feedback: string;
  verifiedAnswer?: VerifiedAnswer;
}

interface PracticeResult {
  attempt: {
    _id: string;
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    status: string;
    subject?: {
      name: string;
    };
    chapter?: {
      title: string;
    };
  };
  responses: ResultResponse[];
  summary: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    pendingEvaluation: number;
    status: string;
  };
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function PracticeContent() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();

  const attemptId = params.attemptId;

  const [practice, setPractice] = useState<PracticeData | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [result, setResult] = useState<PracticeResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [movingNext, setMovingNext] = useState(false);
  const [error, setError] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return localStorage.getItem("commerceHubToken");
  };

  // Load final result. This is also used when a student opens
  // an attempt that was completed earlier from Practice History.
  const fetchPracticeResult = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/practice/${attemptId}/result`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load practice result."
        );
      }

      setResult(data.data);
      setPractice(null);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load result."
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId, router]);

  // Load current question. If the backend says that this attempt
  // has already been completed, load its result instead.
  const fetchCurrentQuestion = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/practice/${attemptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message = data.message || "";

        if (message.toLowerCase().includes("already completed")) {
          await fetchPracticeResult();
          return;
        }

        throw new Error(
          message || "Unable to load practice question."
        );
      }

      setPractice(data.data);
      setResult(null);
      setWrittenAnswer("");
      setSelectedOption(null);
      setSubmission(null);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
      setMovingNext(false);
    }
  }, [attemptId, router, fetchPracticeResult]);

  // Initial question loading.
  // setTimeout defers the request until after the effect completes.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCurrentQuestion();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchCurrentQuestion]);

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!practice) return;

    const isMCQ = practice.question.questionType === "MCQ";

    if (isMCQ && selectedOption === null) {
      setError("Please select an option before submitting.");
      return;
    }

    if (!isMCQ && !writtenAnswer.trim()) {
      setError("Please write your answer before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const body = isMCQ
        ? { selectedOptionIndex: selectedOption }
        : { responseText: writtenAnswer.trim() };

      const response = await fetch(
        `${API_URL}/api/practice/${attemptId}/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit answer."
        );
      }

      setSubmission(data.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Answer submission failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Move to next question
  const handleNextQuestion = async () => {
    try {
      setMovingNext(true);
      setError("");

      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/practice/${attemptId}/next`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to move to next question."
        );
      }

      if (data.data.completed) {
        await fetchPracticeResult();
      } else {
        await fetchCurrentQuestion();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load next question."
      );

      setMovingNext(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f7ff] px-4">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

          <h2 className="font-semibold text-[#193b70]">
            Loading Practice...
          </h2>
        </div>
      </main>
    );
  }

  // Final result screen
  if (result) {
    const summary = result.summary;

    const totalMarks = result.responses.reduce(
      (total, item) => total + (item.question?.marks || 0),
      0
    );

    const marksAwarded = result.responses.reduce(
      (total, item) => total + (item.marksAwarded || 0),
      0
    );

    const evaluatedQuestions =
      summary.answeredQuestions - summary.pendingEvaluation;

    const allEvaluated = summary.pendingEvaluation === 0;

    const percentage =
      totalMarks > 0
        ? (marksAwarded / totalMarks) * 100
        : 0;

    return (
      <main className="min-h-screen bg-[#f3f7ff] px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">

          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">

            {/* Header */}
            <div className="text-center">
              <div className="text-6xl">🎉</div>

              <h1 className="mt-5 text-3xl font-bold text-[#193b70]">
                Practice Completed!
              </h1>

              <p className="mt-3 text-slate-500">
                You have successfully completed your practice session.
              </p>
            </div>

            {/* Marks Summary */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-[#f8faff] p-6 text-center">

              <p className="text-sm font-semibold text-slate-500">
                {allEvaluated ? "FINAL SCORE" : "PROVISIONAL SCORE"}
              </p>

              <h2 className="mt-2 text-4xl font-bold text-[#193b70]">
                {marksAwarded} / {totalMarks}
              </h2>

              {allEvaluated ? (
                <p className="mt-2 text-lg font-bold text-green-700">
                  {percentage.toFixed(1)}%
                </p>
              ) : (
                <p className="mt-2 text-sm text-orange-700">
                  Final percentage will be available after all answers are evaluated.
                </p>
              )}

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-green-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">

              <div className="rounded-2xl bg-blue-50 p-5 text-center">
                <h3 className="text-3xl font-bold text-blue-700">
                  {summary.totalQuestions}
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  Total Questions
                </p>
              </div>

              <div className="rounded-2xl bg-green-50 p-5 text-center">
                <h3 className="text-3xl font-bold text-green-700">
                  {summary.correctAnswers}
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  Correct Answers
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 p-5 text-center">
                <h3 className="text-3xl font-bold text-red-600">
                  {summary.incorrectAnswers}
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  Incorrect Answers
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-5 text-center">
                <h3 className="text-3xl font-bold text-orange-600">
                  {summary.pendingEvaluation}
                </h3>
                <p className="mt-2 text-xs text-slate-600">
                  Pending Evaluation
                </p>
              </div>

            </div>

            {/* Evaluation Progress */}
            <div className="mt-6 rounded-2xl border border-slate-200 p-5">
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-700">
                  Evaluation Progress
                </span>

                <span className="font-bold text-[#193b70]">
                  {evaluatedQuestions} / {summary.answeredQuestions}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-green-600"
                  style={{
                    width: `${
                      summary.answeredQuestions > 0
                        ? (evaluatedQuestions /
                            summary.answeredQuestions) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {allEvaluated
                  ? "All your submitted answers have been evaluated."
                  : "Some answers are still waiting for teacher evaluation."}
              </p>
            </div>

            {/* Session Details */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-[#f8faff] p-5">

              <h2 className="font-bold text-[#193b70]">
                Session Details
              </h2>

              <div className="mt-4 space-y-3 text-sm text-slate-600">

                <p>
                  <strong>Subject:</strong>{" "}
                  {result.attempt.subject?.name || "N/A"}
                </p>

                <p>
                  <strong>Chapter:</strong>{" "}
                  {result.attempt.chapter?.title || "N/A"}
                </p>

                <p>
                  <strong>Questions Answered:</strong>{" "}
                  {summary.answeredQuestions}
                </p>

                <p>
                  <strong>Evaluated Questions:</strong>{" "}
                  {evaluatedQuestions}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span className="font-semibold capitalize text-green-700">
                    {summary.status}
                  </span>
                </p>

              </div>
            </div>

            {/* Individual Answers */}
            <div className="mt-8">

              <h2 className="mb-5 text-xl font-bold text-[#193b70]">
                Your Answers and Teacher Feedback
              </h2>

              <div className="space-y-5">

                {result.responses.map((item, index) => {
                  const isPending =
                    item.evaluationStatus === "pending_review";

                  const statusLabel = isPending
                    ? "Pending Evaluation"
                    : item.evaluationStatus === "reviewed"
                      ? "Teacher Reviewed"
                      : item.evaluationStatus.replaceAll("_", " ");

                  return (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-blue-100 p-5"
                    >

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                          Question {index + 1}
                        </span>

                        <span
                          className={`rounded-full px-3 py-2 text-xs font-bold ${
                            isPending
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {statusLabel}
                        </span>

                      </div>

                      <h3 className="mt-4 font-semibold leading-7 text-[#193b70]">
                        {item.question?.questionText}
                      </h3>

                      <div className="mt-4">
                        <p className="text-sm font-bold text-slate-600">
                          Your Answer
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {item.responseText ||
                            (item.selectedOptionIndex !== null &&
                            item.selectedOptionIndex !== undefined
                              ? `Selected option ${item.selectedOptionIndex + 1}`
                              : "No answer text available.")}
                        </p>
                      </div>

                      {/* Marks */}
                      <div className="mt-4 flex flex-wrap gap-3">

                        <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                          Marks: {item.marksAwarded || 0} /{" "}
                          {item.question?.marks ?? 0}
                        </span>

                        {item.isCorrect === true && (
                          <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                            Correct
                          </span>
                        )}

                        {item.isCorrect === false && !isPending && (
                          <span className="rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                            Incorrect / Partial
                          </span>
                        )}

                      </div>

                      {/* Teacher Feedback */}
                      {!isPending && item.feedback && (
                        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                          <h4 className="font-bold text-green-800">
                            Teacher Feedback
                          </h4>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {item.feedback}
                          </p>

                        </div>
                      )}

                      {/* Pending Message */}
                      {isPending && (
                        <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">

                          <h4 className="font-bold text-orange-800">
                            Awaiting Teacher Evaluation
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-orange-700">
                            Your answer has been submitted successfully.
                            Marks and teacher feedback will appear here
                            after evaluation.
                          </p>

                        </div>
                      )}

                      {/* Verified Answer, if returned by API */}
                      {item.verifiedAnswer && (
                        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                          <h4 className="font-bold text-green-800">
                            Verified Answer
                          </h4>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {item.verifiedAnswer.answerText}
                          </p>

                          {item.verifiedAnswer.explanation && (
                            <div className="mt-4 border-t border-green-200 pt-3">

                              <h5 className="font-bold text-green-800">
                                Explanation
                              </h5>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                {item.verifiedAnswer.explanation}
                              </p>

                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })}

              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={fetchPracticeResult}
                className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 font-bold text-blue-800 transition hover:bg-blue-100"
              >
                ↻ Refresh Result
              </button>

              <button
                type="button"
                onClick={() => router.push("/student/dashboard")}
                className="flex-1 rounded-xl bg-[#193b70] px-6 py-4 font-bold text-white transition hover:bg-[#245394]"
              >
                Back to Dashboard
              </button>

            </div>

          </div>
        </div>
      </main>
    );
  }

  // No question loaded
  if (!practice?.question) {
    return (
      <main className="min-h-screen bg-[#f3f7ff] px-4 py-20">

        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center">

          <h2 className="text-xl font-bold text-[#193b70]">
            Practice question unavailable
          </h2>

          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={() => router.push("/student/dashboard")}
            className="mt-6 rounded-xl bg-[#193b70] px-6 py-3 font-semibold text-white"
          >
            Back to Dashboard
          </button>

        </div>
      </main>
    );
  }

  const question = practice.question;
  const isMCQ = question.questionType === "MCQ";

  const isPendingReview =
    submission?.evaluationStatus === "pending_review";

  const progress =
    practice.totalQuestions > 0
      ? Math.round(
          ((practice.currentQuestionIndex + 1) /
            practice.totalQuestions) *
            100
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#f3f7ff] px-4 py-10 sm:py-14">

      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 text-center">

          <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
            Commerce Hub Practice
          </span>

          <h1 className="mt-5 text-2xl font-bold text-[#193b70] sm:text-3xl">
            {practice.chapter.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Chapter {practice.chapter.chapterNumber}
          </p>

        </div>

        {/* Progress */}
        <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

            <span className="text-sm font-bold text-[#193b70]">
              Question {practice.currentQuestionIndex + 1} of{" "}
              {practice.totalQuestions}
            </span>

            <span className="text-sm font-semibold text-blue-700">
              {progress}% viewed
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-blue-100">

            <div
              className="h-full rounded-full bg-[#2865ae] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />

          </div>

        </section>

        {/* Question Card */}
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-9">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              Question {practice.currentQuestionIndex + 1}
            </span>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700">
                {question.questionType}
              </span>

              <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                {question.marks} Marks
              </span>

              <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-semibold capitalize text-orange-700">
                {question.difficulty}
              </span>

            </div>

          </div>

          <h2 className="text-xl font-bold leading-8 text-[#142f55] sm:text-2xl">
            {question.questionText}
          </h2>

          {/* MCQ Options */}
          {isMCQ && !submission && (

            <div className="mt-8 space-y-4">

              <h3 className="font-semibold text-[#193b70]">
                Select the correct option:
              </h3>

              {question.options.map((option, index) => (

                <label
                  key={index}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                    selectedOption === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >

                  <input
                    type="radio"
                    name="mcqOption"
                    value={index}
                    checked={selectedOption === index}
                    onChange={() => setSelectedOption(index)}
                    className="h-4 w-4 accent-blue-700"
                  />

                  <span className="font-medium text-slate-700">
                    {String.fromCharCode(65 + index)}. {option}
                  </span>

                </label>

              ))}

            </div>
          )}

          {/* Written Answer */}
          {!isMCQ && !submission && (

            <div className="mt-8">

              <label
                htmlFor="writtenAnswer"
                className="mb-3 block font-semibold text-[#193b70]"
              >
                Write Your Answer
              </label>

              <textarea
                id="writtenAnswer"
                rows={7}
                value={writtenAnswer}
                onChange={(e) => setWrittenAnswer(e.target.value)}
                placeholder="Write your answer here..."
                className="w-full resize-y rounded-xl border border-slate-200 p-4 leading-7 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Your written answer will be evaluated by a teacher.
              </p>

            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit Button */}
          {!submission && (

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={submitting}
              className="mt-8 w-full rounded-xl bg-[#193b70] px-6 py-4 font-bold text-white shadow-lg transition hover:bg-[#245394] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Submitting Answer..."
                : "Submit Answer →"}
            </button>
          )}

          {/* Answer Feedback */}
          {submission && (

            <div className="mt-8 space-y-5">

              <div
                className={`rounded-2xl border p-5 ${
                  isPendingReview
                    ? "border-orange-200 bg-orange-50"
                    : submission.isCorrect
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                }`}
              >

                <h3 className="font-bold text-[#193b70]">
                  {isPendingReview
                    ? "Answer Submitted Successfully"
                    : submission.isCorrect
                      ? "Correct Answer!"
                      : "Answer Submitted"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {submission.feedback ||
                    (isPendingReview
                      ? "Your answer is waiting for teacher evaluation."
                      : "Your answer has been evaluated.")}
                </p>

                <div className="mt-3 flex flex-wrap gap-3 text-sm">

                  <span className="font-semibold text-slate-700">
                    Marks: {submission.marksAwarded} / {question.marks}
                  </span>

                  <span className="font-semibold capitalize text-slate-700">
                    Status: {submission.evaluationStatus.replaceAll("_", " ")}
                  </span>

                </div>

              </div>

              {/* Verified Answer */}
              {submission.verifiedAnswer && (

                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

                  <h3 className="font-bold text-green-800">
                    ✓ Verified Answer
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                    {submission.verifiedAnswer.answerText}
                  </p>

                  {submission.verifiedAnswer.explanation && (

                    <div className="mt-5 border-t border-green-200 pt-4">

                      <h4 className="font-bold text-green-800">
                        Explanation
                      </h4>

                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {submission.verifiedAnswer.explanation}
                      </p>

                    </div>
                  )}

                </div>
              )}

              {isPendingReview && (
                <p className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                  Your answer is waiting for teacher evaluation.
                  Your final marks will be updated after evaluation.
                </p>
              )}

              {/* Next Question */}
              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={movingNext}
                className="w-full rounded-xl bg-[#193b70] px-6 py-4 font-bold text-white shadow-lg transition hover:bg-[#245394] disabled:opacity-60"
              >
                {movingNext
                  ? "Loading Next Question..."
                  : practice.currentQuestionIndex + 1 ===
                      practice.totalQuestions
                    ? "Finish Practice →"
                    : "Next Question →"}
              </button>

            </div>
          )}

        </section>

        {/* Bottom Information */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Commerce Hub Kota · Chapter-wise Learning & Practice
        </p>

      </div>
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f3f7ff]">
          Loading Practice...
        </main>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
