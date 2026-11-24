
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Chapter {
  _id: string;
  title: string;
  chapterNumber: number;
  board: string;
  courseLevel: string;
}

interface VerifiedAnswer {
  _id: string;
  answerText: string;
  explanation?: string;
  isVerified: boolean;
}

interface Question {
  _id: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  marks: number;
  answer?: VerifiedAnswer | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function ChapterContent() {
  const params = useParams<{ chapterId: string }>();
  const router = useRouter();

  const chapterId = params.chapterId;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [questionLimit, setQuestionLimit] = useState(10);

  useEffect(() => {
    let cancelled = false;

    const fetchChapterData = async () => {
      try {
        const token = localStorage.getItem("commerceHubToken");

        if (!token) {
          router.replace("/login");
          return;
        }

        // Verify logged-in student
        const profileResponse = await fetch(
          `${API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!profileResponse.ok) {
          localStorage.removeItem("commerceHubToken");
          localStorage.removeItem("commerceHubUser");
          router.replace("/login");
          return;
        }

        const profileResult = await profileResponse.json();
        const student = profileResult.user;

        if (!student) {
          throw new Error("Unable to load student profile.");
        }

        // Fetch chapter details
        const chapterResponse = await fetch(
          `${API_URL}/api/chapters/${chapterId}`
        );

        const chapterResult = await chapterResponse.json();

        if (!chapterResponse.ok) {
          throw new Error(
            chapterResult.message || "Unable to load chapter."
          );
        }

        const chapterData: Chapter = chapterResult.data;

        if (cancelled) return;

        setChapter(chapterData);

        // Check student's academic program
        if (
          chapterData.board !== student.board ||
          chapterData.courseLevel !== student.classLevel
        ) {
          throw new Error(
            "This chapter is not available for your selected academic program."
          );
        }

        // Fetch published questions with verified answers
        const query = new URLSearchParams({
          chapter: chapterId,
          board: student.board || "",
          courseLevel: student.classLevel || "",
        });

        const questionsResponse = await fetch(
          `${API_URL}/api/questions?${query.toString()}`
        );

        const questionsResult = await questionsResponse.json();

        if (!questionsResponse.ok) {
          throw new Error(
            questionsResult.message || "Unable to load questions."
          );
        }

        const questionList: Question[] =
          questionsResult.data || [];

        if (!cancelled) {
          setQuestions(questionList);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchChapterData();

    return () => {
      cancelled = true;
    };
  }, [chapterId, router]);

  // Start practice session
  const handleStartPractice = async () => {
    try {
      setStarting(true);
      setError("");

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/practice/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chapterId,
            questionLimit,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to start practice."
        );
      }

      const attemptId = result.data?.attemptId;

      if (!attemptId) {
        throw new Error("Practice attempt ID was not returned.");
      }

      router.push(`/student/practice/${attemptId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start practice. Please try again."
      );
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f7ff] px-4 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
          <h2 className="font-semibold text-[#193b70]">
            Loading Chapter...
          </h2>
        </div>
      </main>
    );
  }

  const verifiedAnswersCount = questions.filter(
    (question) => question.answer?.isVerified
  ).length;

  return (
    <main className="min-h-screen bg-[#f3f7ff] px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl">

        {/* Chapter Heading */}
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
            Commerce Hub Learning
          </span>

          <h1 className="mt-5 text-3xl font-bold text-[#142f55] sm:text-4xl">
            {chapter?.title || "Chapter Practice"}
          </h1>

          {chapter && (
            <p className="mt-3 text-slate-600">
              Chapter {chapter.chapterNumber} · {chapter.board} ·
              Class {chapter.courseLevel}
            </p>
          )}

          <p className="mt-3 text-sm text-slate-500">
            Learn concepts with published questions and verified solutions.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Published Questions and Answers */}
        <section className="mb-10">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-[#193b70]">
                Published Questions & Answers
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Study questions and solutions verified by your teachers.
              </p>
            </div>

            <span className="w-fit rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              {verifiedAnswersCount} Verified Answers
            </span>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
              <div className="mb-4 text-5xl">📖</div>
              <h3 className="text-xl font-bold text-[#193b70]">
                No Published Questions Yet
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                Questions and their verified answers will appear here
                when your teacher and admin complete the approval process.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <article
                  key={question._id}
                  className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Question Header */}
                  <div className="border-b border-slate-100 bg-[#f8faff] p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        Question {index + 1}
                      </span>

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Published
                      </span>
                    </div>

                    <h3 className="text-lg font-bold leading-7 text-[#193b70] sm:text-xl">
                      {question.questionText}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        {question.questionType}
                      </span>

                      <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium capitalize text-slate-600 ring-1 ring-slate-200">
                        {question.difficulty}
                      </span>

                      <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        {question.marks} {question.marks === 1 ? "Mark" : "Marks"}
                      </span>
                    </div>
                  </div>

                  {/* Verified Answer */}
                  <div className="p-5 sm:p-6">
                    {question.answer?.isVerified ? (
                      <>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                            ✓
                          </span>

                          <h4 className="text-lg font-bold text-green-800">
                            Verified Answer
                          </h4>

                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            Teacher Approved
                          </span>
                        </div>

                        <div className="rounded-xl border border-green-100 bg-green-50/60 p-5">
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {question.answer.answerText}
                          </p>
                        </div>

                        {question.answer.explanation?.trim() && (
                          <div className="mt-5">
                            <h5 className="mb-2 font-bold text-[#193b70]">
                              Explanation
                            </h5>

                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                {question.answer.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700">
                        The verified answer is not available yet.
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Practice Test Section */}
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">

          <div className="bg-gradient-to-r from-[#193b70] to-[#2865ae] px-6 py-10 text-center text-white sm:px-10">
            <div className="mb-4 text-5xl">📚</div>

            <h2 className="text-2xl font-bold sm:text-3xl">
              Chapter Practice Test
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100">
              Practice one question at a time, submit your answers,
              and improve your understanding with verified solutions.
            </p>
          </div>

          <div className="p-6 sm:p-10">

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="rounded-2xl bg-blue-50 p-5 text-center">
                <div className="text-3xl font-bold text-[#193b70]">
                  {questions.length}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Available Questions
                </p>
              </div>

              <div className="rounded-2xl bg-green-50 p-5 text-center">
                <div className="text-3xl font-bold text-green-700">
                  1
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Question at a Time
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-5 text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {verifiedAnswersCount}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Verified Answers
                </p>
              </div>

            </div>

            {/* Practice Instructions */}
            <div className="mt-8 rounded-2xl border border-blue-100 bg-[#f8faff] p-6">

              <h3 className="text-lg font-bold text-[#193b70]">
                How Practice Mode Works
              </h3>

              <div className="mt-5 space-y-4">
                {[
                  "One question will appear at a time.",
                  "Select an option for MCQ or write your answer for descriptive questions.",
                  "Submit your answer to see the verified solution.",
                  "Move to the next question after submission.",
                  "View your practice summary after completing all questions.",
                ].map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {index + 1}
                    </span>

                    <p className="pt-1 text-sm leading-6 text-slate-600">
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Limit */}
            <div className="mt-8">
              <label
                htmlFor="questionLimit"
                className="mb-3 block font-semibold text-[#193b70]"
              >
                Select Number of Questions
              </label>

              <select
                id="questionLimit"
                value={questionLimit}
                onChange={(e) =>
                  setQuestionLimit(Number(e.target.value))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
              >
                {[5, 10, 15, 20, 25, 50].map((limit) => (
                  <option key={limit} value={limit}>
                    {limit} Questions
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                The actual number of questions depends on the
                published and verified questions available in this chapter.
              </p>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartPractice}
              disabled={starting || questions.length === 0}
              className="mt-8 w-full rounded-xl bg-[#193b70] px-6 py-4 font-bold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#245394] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting
                ? "Starting Practice..."
                : questions.length === 0
                  ? "No Questions Available"
                  : "Start Practice →"}
            </button>

            {questions.length === 0 && (
              <p className="mt-3 text-center text-sm text-slate-500">
                Practice will be available when questions are published
                with verified answers.
              </p>
            )}

          </div>
        </section>

        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-8 w-full rounded-xl border border-blue-200 bg-white px-5 py-4 font-semibold text-[#193b70] transition hover:bg-blue-50"
        >
          ← Back to Chapters
        </button>

      </div>
    </main>
  );
}

export default function ChapterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f3f7ff] px-4 py-20 text-center">
          Loading chapter...
        </main>
      }
    >
      <ChapterContent />
    </Suspense>
  );
}
