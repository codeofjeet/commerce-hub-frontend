
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  mobileNumber?: string;
  city?: string;
  dateOfBirth?: string;
  board?: string;
  classLevel?: string;
}

interface Subject {
  _id: string;
  name: string;
  slug: string;
  boards: string[];
  courseLevels: string[];
  description: string;
  isActive: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const subjectIcons: Record<string, string> = {
  Accountancy: "📒",
  Economics: "📊",
  "Business Studies": "💼",
};

export default function StudentDashboard() {
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjectError, setSubjectError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        router.replace("/login");
        return;
      }

      let profileLoaded = false;

      try {
        const profileResponse = await fetch(
          `${API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const profileResult = await profileResponse.json();

        if (!profileResponse.ok) {
          localStorage.removeItem("commerceHubToken");
          localStorage.removeItem("commerceHubUser");
          router.replace("/login");
          return;
        }

        const currentStudent: Student = profileResult.user;

        setStudent(currentStudent);
        profileLoaded = true;

        setSubjectsLoading(true);

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
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";

        if (profileLoaded) {
          setSubjectError(message);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
        setSubjectsLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("commerceHubToken");
    localStorage.removeItem("commerceHubUser");
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="text-red-600">
          {error || "Student information could not be loaded."}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const classLabel =
    student.classLevel === "11" || student.classLevel === "12"
      ? `Class ${student.classLevel}`
      : student.classLevel || "Not selected";

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Page Heading */}
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Commerce Hub Kota
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Dashboard Overview
            </h1>

            <p className="mt-2 text-slate-500">
              Welcome back, {student.name}! Continue your commerce learning.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </section>

      {/* Welcome Banner */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
          Student Learning Portal
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          Welcome, {student.name}!
        </h2>

        <p className="mt-3 max-w-2xl leading-7 text-blue-100">
          Learn commerce concepts, practice chapter-wise questions,
          explore verified answers and improve your academic performance.
        </p>

        <button
          onClick={() => router.push("/student/chat")}
          className="mt-6 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          Start Learning →
        </button>
      </section>

      {/* Academic Summary */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Board</p>
            <span className="text-2xl">🎓</span>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {student.board || "Not selected"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your academic board
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Class / Course</p>
            <span className="text-2xl">📖</span>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {classLabel}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your current academic level
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Available Subjects</p>
            <span className="text-2xl">📚</span>
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {subjectsLoading ? "..." : subjects.length}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Subjects available for you
          </p>
        </div>

      </section>

      {/* My Subjects */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              My Learning Subjects
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Explore subjects available for your board and class.
            </p>
          </div>

          <button
            onClick={() => router.push("/student/subjects")}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View All →
          </button>
        </div>

        <div className="p-6">

          {subjectsLoading ? (
            <p className="text-slate-500">Loading your subjects...</p>
          ) : subjectError ? (
            <p className="text-red-600">{subjectError}</p>
          ) : subjects.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <button
                  type="button"
                  key={subject._id}
                  onClick={() =>
                    router.push(`/student/subjects/${subject._id}`)
                  }
                  className="group rounded-xl border border-slate-200 p-6 text-left transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                    {subjectIcons[subject.name] || "📚"}
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                    {subject.name}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {subject.description || "Explore chapters and practice questions."}
                  </p>

                  <p className="mt-4 text-sm font-semibold text-blue-600">
                    Explore Subject →
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-8 text-center">
              <p className="text-slate-600">
                No subjects are currently available for your selected board and class.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* Quick Access */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Quick Access
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Quickly access your learning activities.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <button
            onClick={() => router.push("/student/chat")}
            className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="text-3xl">💬</span>
            <h3 className="mt-4 font-bold text-slate-900">
              Commerce Chat
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Ask questions and get verified commerce answers.
            </p>
          </button>

          <button
            onClick={() => router.push("/student/subjects")}
            className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="text-3xl">📝</span>
            <h3 className="mt-4 font-bold text-slate-900">
              Chapter-wise Learning
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Explore subjects and their chapters.
            </p>
          </button>

          <button
            onClick={() => router.push("/student/results")}
            className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="text-3xl">📊</span>
            <h3 className="mt-4 font-bold text-slate-900">
              My Results
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              View your practice history and performance.
            </p>
          </button>

        </div>
      </section>

      {/* Student Profile */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold text-slate-900">
          Student Profile
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Your registered account information.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <div>
            <p className="text-sm text-slate-500">Full Name</p>
            <p className="mt-1 font-semibold text-slate-900">
              {student.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Email Address</p>
            <p className="mt-1 font-semibold text-slate-900">
              {student.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Mobile Number</p>
            <p className="mt-1 font-semibold text-slate-900">
              {student.mobileNumber || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">City</p>
            <p className="mt-1 font-semibold text-slate-900">
              {student.city || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Date of Birth</p>
            <p className="mt-1 font-semibold text-slate-900">
              {student.dateOfBirth
                ? new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">Account Role</p>
            <p className="mt-1 font-semibold capitalize text-slate-900">
              {student.role}
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
