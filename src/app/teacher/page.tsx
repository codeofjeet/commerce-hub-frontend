
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface DashboardStats {
  pendingQuestions: number;
  answersSubmitted: number;
  verifiedAnswers: number;
  assignedSubjects: number;
}

interface DashboardStat {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    pendingQuestions: 0,
    answersSubmitted: 0,
    verifiedAnswers: 0,
    assignedSubjects: 0,
  });

  const [pendingTimedAnswers, setPendingTimedAnswers] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const token = localStorage.getItem("commerceHubToken");

        if (!token) return;

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch dashboard statistics and recent notifications.
        const [
          dashboardResponse,
          timedTestResponse,
          notificationResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/question-submissions/teacher/dashboard-stats`,
            { headers, cache: "no-store" }
          ),
          fetch(
            `${API_URL}/api/teacher-timed-tests/pending`,
            { headers, cache: "no-store" }
          ),
          fetch(
            `${API_URL}/api/notifications?page=1&limit=5`,
            { headers, cache: "no-store" }
          ),
        ]);

        const [
          dashboardResult,
          timedTestResult,
          notificationResult,
        ] = await Promise.all([
          dashboardResponse.json(),
          timedTestResponse.json(),
          notificationResponse.json(),
        ]);

        if (dashboardResponse.ok && dashboardResult.success) {
          setDashboardStats({
            pendingQuestions:
              dashboardResult.data.pendingQuestions || 0,
            answersSubmitted:
              dashboardResult.data.answersSubmitted || 0,
            verifiedAnswers:
              dashboardResult.data.verifiedAnswers || 0,
            assignedSubjects:
              dashboardResult.data.assignedSubjects || 0,
          });
        }

        if (timedTestResponse.ok && timedTestResult.success) {
          setPendingTimedAnswers(timedTestResult.count || 0);
        }

        if (
          notificationResponse.ok &&
          notificationResult.success
        ) {
          setNotifications(
            notificationResult.data.notifications || []
          );
        }
      } catch (error) {
        console.error("Dashboard data error:", error);
      } finally {
        setLoading(false);
        setNotificationLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const stats: DashboardStat[] = [
    {
      title: "Pending Questions",
      value: loading ? "..." : dashboardStats.pendingQuestions,
      icon: "📩",
      color: "text-orange-600",
    },
    {
      title: "Answers Submitted",
      value: loading ? "..." : dashboardStats.answersSubmitted,
      icon: "📝",
      color: "text-blue-600",
    },
    {
      title: "Verified Answers",
      value: loading ? "..." : dashboardStats.verifiedAnswers,
      icon: "✅",
      color: "text-green-600",
    },
    {
      title: "Assigned Subjects",
      value: loading ? "..." : dashboardStats.assignedSubjects,
      icon: "📚",
      color: "text-purple-600",
    },
    {
      title: "Pending Timed Answers",
      value: loading ? "..." : pendingTimedAnswers,
      icon: "⏱️",
      color: "text-orange-600",
    },
  ];

// Mark notification as read and navigate
const handleNotificationClick = async (
  notification: Notification
) => {
  const token = localStorage.getItem("commerceHubToken");

  if (!token) return;

  try {
    if (!notification.isRead) {
      const response = await fetch(
        `${API_URL}/api/notifications/${notification._id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to mark notification as read"
        );
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );

      // Inform the header to refresh its unread count.
      window.dispatchEvent(
        new CustomEvent("notifications-updated")
      );
    }

    router.push(
      notification.link || "/teacher/questions"
    );
  } catch (error) {
    console.error("Notification update error:", error);
  }
};

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "QUESTION_ASSIGNED":
        return "📝";
      case "ANSWER_VERIFIED":
        return "✅";
      case "ANSWER_REJECTED":
        return "❌";
      case "SUBJECT_ASSIGNED":
        return "📚";
      default:
        return "🔔";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">

        {/* Dashboard Heading */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-blue-600">
            COMMERCE HUB KOTA
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Teacher Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Manage student questions, review answers and evaluate timed examinations.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>
                <span className="text-2xl">{stat.icon}</span>
              </div>

              <h2 className={`mt-4 text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Recent Notifications */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Recent Notifications
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest updates and activities.
              </p>
            </div>

            <Link
              href="/teacher/questions"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View Student Questions →
            </Link>
          </div>

          {notificationLoading ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Loading notifications...
            </p>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl">🔕</p>
              <p className="mt-2 font-semibold text-slate-700">
                No recent notifications
              </p>
              <p className="mt-1 text-sm text-slate-500">
                You are all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <button
  key={notification._id}
  type="button"
  onClick={() => handleNotificationClick(notification)}
  className={`flex w-full items-start gap-4 rounded-lg px-3 py-4 text-left transition hover:bg-slate-50 ${
    !notification.isRead ? "bg-blue-50/60" : ""
  }`}
>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {notification.title}
                      </h3>

                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Teacher Activities */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-800">
            Teacher Activities
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Manage questions, prepare answers and evaluate student examinations.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/teacher/questions"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Student Questions
            </Link>

            <Link
              href="/teacher/my-answers"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View My Answers
            </Link>

            <Link
              href="/teacher/evaluations"
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Evaluations
            </Link>

            <Link
              href="/teacher/timed-tests"
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              ⏱️ Timed Test Evaluation
            </Link>
          </div>
        </div>

        {/* Timed Test Information */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-900">
            Timed Examination Management
          </h2>

          <p className="mt-2 text-sm leading-6 text-blue-800">
            Review written answers submitted by students in timed examinations.
            Award marks, provide feedback and update student examination results.
          </p>

          <Link
            href="/teacher/timed-tests"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open Evaluation Desk →
          </Link>
        </div>

      </div>
    </main>
  );
}
