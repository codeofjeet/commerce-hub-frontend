
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Student {
  name: string;
  board?: string;
  classLevel?: string;
}

interface Subject {
  _id: string;
  name: string;
  slug: string;
  boards: string[];
  courseLevels: string[];
  description?: string;
  isActive: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const subjectIcons: Record<string, string> = {
  Accountancy: "📒",
  Economics: "📊",
  "Business Studies": "💼",
};

export default function StudentSubjectsPage() {
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // Get logged-in student profile
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

        // Get all available subjects
        const subjectsResponse = await fetch(
          `${API_URL}/api/subjects`
        );

        const subjectsResult = await subjectsResponse.json();

        if (!subjectsResponse.ok) {
          throw new Error(
            subjectsResult.message || "Unable to load subjects."
          );
        }

        const allSubjects: Subject[] = subjectsResult.data || [];

        // Filter subjects according to student's board and class
        const matchingSubjects = allSubjects.filter(
          (subject) =>
            subject.isActive &&
            subject.boards.includes(currentStudent.board || "") &&
            subject.courseLevels.includes(
              currentStudent.classLevel || ""
            )
        );

        setSubjects(matchingSubjects);
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

    fetchSubjects();
  }, [router]);

  const classLabel =
    student?.classLevel === "11" || student?.classLevel === "12"
      ? `Class ${student.classLevel}`
      : student?.classLevel || "";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-lg text-slate-600">
          Loading your subjects...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Commerce Hub Kota
        </span>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          My Learning Subjects
        </h1>

        <p className="mt-2 text-slate-600">
          Explore your commerce subjects and study chapter by chapter.
        </p>
      </div>

      {/* Academic Information */}
      {student && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="font-semibold text-slate-800">
            Your Academic Information
          </h2>

          <p className="mt-2 font-medium text-blue-700">
            {student.board} Board · {classLabel}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Subjects */}
      {!error && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Available Subjects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {subjects.length} subjects available for your course.
              </p>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <div className="mb-3 text-5xl">📚</div>

              <h3 className="text-lg font-semibold text-slate-800">
                No Subjects Available
              </h3>

              <p className="mt-2 text-slate-500">
                No active subjects are currently available for your
                board and class.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => (
                <div
                  key={subject._id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl">
                    {subjectIcons[subject.name] || "📚"}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {subject.name}
                  </h3>

                  <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                    {subject.description ||
                      `${subject.name} question bank for ${classLabel} commerce students.`}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {student?.board}
                    </span>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      {classLabel}
                    </span>
                  </div>

                  <Link
                    href={`/student/subjects/${subject._id}`}
                    className="mt-6 inline-flex items-center font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Explore Subject →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
