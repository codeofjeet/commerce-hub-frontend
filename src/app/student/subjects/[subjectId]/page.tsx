
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Student {
  name: string;
  board?: string;
  classLevel?: string;
}

interface Subject {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  boards: string[];
  courseLevels: string[];
}

interface Chapter {
  _id: string;
  title: string;
  chapterNumber: number;
  subject: string;
  board: string;
  courseLevel: string;
  isActive: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function SubjectDetailsContent() {
  const params = useParams();
  const router = useRouter();

  const subjectId = params.subjectId as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!subjectId) return;

    const fetchSubjectDetails = async () => {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // Get student profile
        const profileResponse = await fetch(
          `${API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const profileResult = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileResult.message || "Unable to load student profile."
          );
        }

        const currentStudent: Student = profileResult.user;
        setStudent(currentStudent);

        // Get subject details
        const subjectResponse = await fetch(
          `${API_URL}/api/subjects`
        );

        const subjectResult = await subjectResponse.json();

        if (!subjectResponse.ok) {
          throw new Error(
            subjectResult.message || "Unable to load subjects."
          );
        }

        const selectedSubject = (subjectResult.data || []).find(
          (item: Subject) => item._id === subjectId
        );

        if (!selectedSubject) {
          throw new Error("Subject not found.");
        }

        setSubject(selectedSubject);

        // Get chapters for selected subject and student's course
        const query = new URLSearchParams({
          subject: subjectId,
          board: currentStudent.board || "",
          courseLevel: currentStudent.classLevel || "",
        });

        const chapterResponse = await fetch(
          `${API_URL}/api/chapters?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const chapterResult = await chapterResponse.json();

        if (!chapterResponse.ok) {
          throw new Error(
            chapterResult.message || "Unable to load chapters."
          );
        }

        const chapterData: Chapter[] = chapterResult.data || [];

        setChapters(
          chapterData
            .filter((chapter) => chapter.isActive)
            .sort(
              (a, b) => a.chapterNumber - b.chapterNumber
            )
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [subjectId, router]);

  const classLabel =
    student?.classLevel === "11" || student?.classLevel === "12"
      ? `Class ${student.classLevel}`
      : student?.classLevel || "";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-slate-600">
          Loading subject details...
        </p>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-xl font-bold text-red-700">
          Unable to load subject
        </h2>

        <p className="mt-2 text-red-600">
          {error || "Subject not found."}
        </p>

        <button
          onClick={() => router.back()}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        <Link
          href="/student/dashboard"
          className="hover:text-blue-600"
        >
          Dashboard
        </Link>

        <span className="mx-2">/</span>

        <Link
          href="/student/subjects"
          className="hover:text-blue-600"
        >
          My Subjects
        </Link>

        <span className="mx-2">/</span>

        <span className="font-medium text-blue-600">
          {subject.name}
        </span>
      </div>

      {/* Subject Header */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <span className="text-sm font-semibold uppercase tracking-wider text-blue-100">
          Commerce Hub Kota
        </span>

        <h1 className="mt-3 text-3xl font-bold">
          {subject.name}
        </h1>

        <p className="mt-3 max-w-2xl text-blue-100">
          {subject.description ||
            `Explore ${subject.name} chapter-wise learning and practice questions.`}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full bg-white/20 px-4 py-2 text-sm">
            {student?.board} Board
          </span>

          <span className="rounded-full bg-white/20 px-4 py-2 text-sm">
            {classLabel}
          </span>
        </div>
      </section>

      {/* Chapter Summary */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Chapters
          </p>

          <h2 className="mt-2 text-3xl font-bold text-blue-600">
            {chapters.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Selected Subject
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            {subject.name}
          </h2>
        </div>
      </section>

      {/* Chapters */}
      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900">
            Chapter-wise Learning
          </h2>

          <p className="mt-2 text-slate-600">
            Select a chapter to explore its questions and answers.
          </p>
        </div>

        {chapters.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="text-5xl">📚</div>

            <h3 className="mt-4 text-xl font-semibold text-slate-800">
              No Chapters Available
            </h3>

            <p className="mt-2 text-slate-500">
              Chapters have not yet been added for this subject,
              board and class.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {chapters.map((chapter) => (
              <div
                key={chapter._id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600">
                    {String(chapter.chapterNumber).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Chapter {chapter.chapterNumber}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      {chapter.title}
                    </h3>
                  </div>
                </div>

                <Link
                  href={`/student/chapters/${chapter._id}`}
                  className="mt-6 inline-flex items-center font-semibold text-blue-600 hover:text-blue-800"
                >
                  Explore Chapter →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Back Button */}
      <div>
        <Link
          href="/student/subjects"
          className="inline-flex rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-100"
        >
          ← Back to My Subjects
        </Link>
      </div>
    </div>
  );
}

export default function SubjectDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-lg text-slate-600">
            Loading subject details...
          </p>
        </div>
      }
    >
      <SubjectDetailsContent />
    </Suspense>
  );
}