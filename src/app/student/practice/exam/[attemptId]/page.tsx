
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Question {
  _id: string;
  questionText: string;
  questionType: "MCQ" | "SHORT" | "LONG" | "NUMERICAL";
  options?: string[];
  difficulty?: string;
  marks: number;
}

interface AttemptQuestion {
  question: Question;
  selectedOptionIndex: number | null;
  responseText: string;
  isAnswered: boolean;
}

interface TimedAttempt {
  attemptId: string;
  test: {
    _id: string;
    title: string;
    description?: string;
  };
  status: string;
  totalQuestions: number;
  totalMarks: number;
  startedAt: string;
  expiresAt: string;
  questions: AttemptQuestion[];
}

function ExaminationContent() {
  const params = useParams();
  const router = useRouter();

  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<TimedAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const [answers, setAnswers] = useState<
    Record<string, { selectedOptionIndex: number | null; responseText: string }>
  >({});

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [showSubmitConfirmation, setShowSubmitConfirmation] =
    useState(false);

  const [submitted, setSubmitted] = useState(false);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const submittedRef = useRef(false);
  const savingRef = useRef(false);

  // Fetch examination questions
  useEffect(() => {
    let isMounted = true;

    const fetchAttempt = async () => {
      try {
        const token = localStorage.getItem("commerceHubToken");

        if (!token) {
          throw new Error("Please log in to continue.");
        }

        const response = await fetch(
          `${API_URL}/api/student-timed-tests/attempts/${attemptId}`,
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
            result.message || "Unable to load examination."
          );
        }

        const data: TimedAttempt = result.data;

        if (data.status !== "in_progress") {
          throw new Error("This examination is no longer in progress.");
        }

        const initialAnswers: Record<
          string,
          { selectedOptionIndex: number | null; responseText: string }
        > = {};

        data.questions.forEach((item) => {
          const questionId = item.question._id;

          initialAnswers[questionId] = {
            selectedOptionIndex: item.selectedOptionIndex ?? null,
            responseText: item.responseText || "",
          };
        });

        const seconds = Math.max(
          0,
          Math.floor(
            (new Date(data.expiresAt).getTime() - Date.now()) / 1000
          )
        );

        if (isMounted) {
          setAttempt(data);
          setAnswers(initialAnswers);
          setRemainingSeconds(seconds);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load examination."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAttempt();

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  // Save answer to backend
  const saveAnswer = useCallback(
    async (
      questionId: string,
      selectedOptionIndex: number | null,
      responseText: string
    ) => {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/api/student-timed-tests/attempts/${attemptId}/answer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId,
            selectedOptionIndex,
            responseText,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save answer.");
      }
    },
    [attemptId]
  );

  // Save an answer when the student selects an MCQ option
  const handleOptionSelect = async (
    questionId: string,
    optionIndex: number
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: {
        selectedOptionIndex: optionIndex,
        responseText: "",
      },
    }));

    try {
      setSaving(true);
      setSaveMessage("Saving answer...");

      await saveAnswer(questionId, optionIndex, "");

      setSaveMessage("Answer saved");
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : "Answer could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  // Save written answers with a short delay
  const handleWrittenAnswer = (
    questionId: string,
    value: string
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: {
        selectedOptionIndex: null,
        responseText: value,
      },
    }));

    if (timersRef.current[questionId]) {
      clearTimeout(timersRef.current[questionId]);
    }

    setSaveMessage("Unsaved changes");

    timersRef.current[questionId] = setTimeout(async () => {
      try {
        setSaving(true);
        await saveAnswer(questionId, null, value);
        setSaveMessage("Answer saved");
      } catch (err) {
        setSaveMessage(
          err instanceof Error ? err.message : "Unable to save answer."
        );
      } finally {
        setSaving(false);
        delete timersRef.current[questionId];
      }
    }, 700);
  };

  // Submit examination
  const submitExam = useCallback(async () => {
    if (submittedRef.current || savingRef.current) return;

    submittedRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      // Cancel pending autosave timers
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};

      // Save all current answers before final submission
      const currentAnswers = answers;

      for (const item of attempt?.questions || []) {
        const questionId = item.question._id;
        const answer = currentAnswers[questionId];

        if (!answer) continue;

        const hasAnswer =
          answer.selectedOptionIndex !== null ||
          answer.responseText.trim().length > 0;

        if (hasAnswer) {
          await saveAnswer(
            questionId,
            answer.selectedOptionIndex,
            answer.responseText
          );
        }
      }

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/api/student-timed-tests/attempts/${attemptId}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit examination."
        );
      }

      setSubmitted(true);
      setShowSubmitConfirmation(false);
    } catch (err) {
      submittedRef.current = false;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit examination."
      );
    } finally {
      setSubmitting(false);
    }
  }, [attempt, answers, attemptId, saveAnswer]);

  // Countdown timer
  useEffect(() => {
    if (!attempt || submitted) return;

    const interval = setInterval(() => {
      const seconds = Math.max(
        0,
        Math.floor(
          (new Date(attempt.expiresAt).getTime() - Date.now()) / 1000
        )
      );

      setRemainingSeconds(seconds);

      if (seconds <= 0 && !submittedRef.current) {
        clearInterval(interval);
        submitExam();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt, submitted, submitExam]);

  // Clean up pending answer timers
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  // Format countdown
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">
            Loading examination...
          </p>
        </div>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-bold text-red-700">
          Unable to Open Examination
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          onClick={() => router.push("/student/practice")}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white"
        >
          Back to Tests
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>

        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          Examination Submitted!
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Your answers have been submitted successfully.
          MCQ answers are evaluated automatically, while written
          answers will be evaluated by your teacher.
        </p>

       <button
  onClick={() =>
    router.push(`/student/practice/result/${attemptId}`)
  }
  className="mt-7 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
>
  View Examination Result →
</button>
      </div>
    );
  }

  if (!attempt || !attempt.questions.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        No questions are available in this examination.
      </div>
    );
  }

  const currentItem = attempt.questions[currentIndex];
  const currentQuestion = currentItem.question;
  const currentAnswer = answers[currentQuestion._id] || {
    selectedOptionIndex: null,
    responseText: "",
  };

  const answeredCount = attempt.questions.filter((item) => {
    const answer = answers[item.question._id];

    return (
      answer &&
      (answer.selectedOptionIndex !== null ||
        answer.responseText.trim().length > 0)
    );
  }).length;

  const unansweredCount = attempt.totalQuestions - answeredCount;

  const progress = Math.round(
    (answeredCount / attempt.totalQuestions) * 100
  );

  return (
    <div className="space-y-5">

      {/* Examination Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Student Examination Desk
            </p>

            <h1 className="mt-1 text-xl font-bold text-gray-900">
              {attempt.test.title}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Attempt ID: {attempt.attemptId}
            </p>
          </div>

          <div
            className={`rounded-xl px-5 py-3 text-center ${
              remainingSeconds <= 300
                ? "bg-red-50 text-red-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide">
              Time Remaining
            </p>

            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatTime(remainingSeconds)}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Questions</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {attempt.totalQuestions}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Answered</p>
          <p className="mt-1 text-xl font-bold text-green-600">
            {answeredCount}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Unanswered</p>
          <p className="mt-1 text-xl font-bold text-red-600">
            {unansweredCount}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-gray-700">
            Examination Progress
          </span>
          <span className="font-bold text-blue-600">
            {progress}%
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Examination Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Question Area */}
        <div className="space-y-5 lg:col-span-2">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                Question {currentIndex + 1} of {attempt.totalQuestions}
              </span>

              <div className="flex items-center gap-2">
                <span className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                  {currentQuestion.questionType}
                </span>

                <span className="rounded-md bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">
                  {currentQuestion.marks} Marks
                </span>
              </div>
            </div>

            <h2 className="mt-7 text-lg font-semibold leading-8 text-gray-900">
              {currentQuestion.questionText}
            </h2>

            {/* MCQ Options */}
            {currentQuestion.questionType === "MCQ" && (
              <div className="mt-7 space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      handleOptionSelect(currentQuestion._id, index)
                    }
                    disabled={submitting}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                      currentAnswer.selectedOptionIndex === index
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        currentAnswer.selectedOptionIndex === index
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="text-sm font-medium text-gray-800">
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Written Answer */}
            {currentQuestion.questionType !== "MCQ" && (
              <div className="mt-7">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Your Answer
                </label>

                <textarea
                  value={currentAnswer.responseText}
                  onChange={(e) =>
                    handleWrittenAnswer(
                      currentQuestion._id,
                      e.target.value
                    )
                  }
                  disabled={submitting}
                  rows={
                    currentQuestion.questionType === "LONG" ? 9 : 5
                  }
                  placeholder="Write your answer here..."
                  className="w-full rounded-xl border border-gray-300 p-4 text-sm leading-7 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Your written answer is saved automatically.
                </p>
              </div>
            )}

            {/* Save Status */}
            <div className="mt-5 flex min-h-6 items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {saving ? "Saving..." : saveMessage}
              </p>

              <span className="text-xs font-medium text-gray-500">
                {currentAnswer.selectedOptionIndex !== null ||
                currentAnswer.responseText.trim()
                  ? "Answered"
                  : "Not answered"}
              </span>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex justify-between gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((previous) =>
                    Math.max(0, previous - 1)
                  )
                }
                disabled={currentIndex === 0 || submitting}
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((previous) =>
                    Math.min(
                      attempt.totalQuestions - 1,
                      previous + 1
                    )
                  )
                }
                disabled={
                  currentIndex === attempt.totalQuestions - 1 ||
                  submitting
                }
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>

          </div>
        </div>

        {/* Question Palette */}
        <aside className="space-y-5">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-gray-900">
              Question Navigator
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Select a question to navigate.
            </p>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {attempt.questions.map((item, index) => {
                const answer = answers[item.question._id];

                const isAnswered =
                  answer &&
                  (answer.selectedOptionIndex !== null ||
                    answer.responseText.trim().length > 0);

                return (
                  <button
                    key={item.question._id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    disabled={submitting}
                    className={`flex h-10 items-center justify-center rounded-lg border text-sm font-bold transition ${
                      currentIndex === index
                        ? "border-blue-600 bg-blue-600 text-white"
                        : isAnswered
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-blue-600" />
                <span className="text-xs text-gray-600">
                  Current question
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-green-500" />
                <span className="text-xs text-gray-600">
                  Answered
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded border border-gray-300 bg-gray-100" />
                <span className="text-xs text-gray-600">
                  Not answered
                </span>
              </div>
            </div>
          </div>

          {/* Submit Card */}
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <h3 className="font-bold text-gray-900">
              Submit Examination
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Please review your answers before submitting.
              You cannot change answers after submission.
            </p>

            <button
              type="button"
              onClick={() => setShowSubmitConfirmation(true)}
              disabled={submitting}
              className="mt-5 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              Submit Test
            </button>
          </div>

        </aside>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submission Confirmation */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">
              Submit Examination?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              You have answered {answeredCount} out of{" "}
              {attempt.totalQuestions} questions.
              {unansweredCount > 0 &&
                ` ${unansweredCount} question(s) are still unanswered.`}
              {" "}Once submitted, you cannot change your answers.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                disabled={submitting}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700"
              >
                Continue Test
              </button>

              <button
                onClick={submitExam}
                disabled={submitting}
                className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Progress */}
      {submitting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-gray-800">
              Submitting your examination...
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Please do not close this page.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TimedExaminationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          Loading examination...
        </div>
      }
    >
      <ExaminationContent />
    </Suspense>
  );
}
