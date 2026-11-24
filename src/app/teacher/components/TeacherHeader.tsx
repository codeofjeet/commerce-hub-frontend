
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const pageTitles: Record<string, string> = {
  "/teacher": "Dashboard",
  "/teacher/questions": "Student Questions",
  "/teacher/my-answers": "My Answers",
  "/teacher/evaluations": "Evaluations",
  "/teacher/timed-tests": "Timed Test Evaluation",
  "/teacher/performance-reports": "Performance Reports",
  "/teacher/profile": "My Profile",
};

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    _id: string;
    name: string;
    role: string;
  } | null;
}

interface Teacher {
  name: string;
  email: string;
  role: string;
}

export default function TeacherHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const pageTitle =
    pageTitles[pathname] || "Teacher Portal";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teacher, setTeacher] = useState<Teacher | null>(null);
const [profileLoading, setProfileLoading] = useState(true);

  // Get authentication token
  const getToken = () => {
    return localStorage.getItem("commerceHubToken");
  };

// Fetch logged-in teacher profile
const fetchTeacherProfile = useCallback(async () => {
  const token = localStorage.getItem("commerceHubToken");

  if (!token) {
    setProfileLoading(false);
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/teachers/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to fetch teacher profile"
      );
    }

    setTeacher(result.data);
  } catch (error) {
    console.error("Teacher profile fetch error:", error);
  } finally {
    setProfileLoading(false);
  }
}, []);

  // Fetch notifications
 const fetchNotifications = useCallback(async () => {
  const token = localStorage.getItem("commerceHubToken");

  if (!token) return;

  try {
    setLoading(true);
    setError("");

    const response = await fetch(
      `${API_URL}/api/notifications?page=1&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to fetch notifications"
      );
    }

    setNotifications(result.data.notifications || []);
    setUnreadCount(result.data.unreadCount || 0);
  } catch (err) {
    console.error("Notification fetch error:", err);
    setError("Unable to load notifications.");
  } finally {
    setLoading(false);
  }
}, []);

  
// Initial fetch, automatic refresh and cross-component notification sync
useEffect(() => {
  const initialFetch = setTimeout(() => {
    fetchNotifications();
    fetchTeacherProfile();
  }, 0);

  // Refresh when another component updates notifications.
  const handleNotificationsUpdated = () => {
    fetchNotifications();
  };

  window.addEventListener(
    "notifications-updated",
    handleNotificationsUpdated
  );

  // Automatic refresh every 30 seconds.
  const interval = setInterval(() => {
    fetchNotifications();
  }, 30000);

  return () => {
    clearTimeout(initialFetch);
    clearInterval(interval);

    window.removeEventListener(
      "notifications-updated",
      handleNotificationsUpdated
    );
  };
}, [fetchNotifications, fetchTeacherProfile]);


  // Mark one notification as read
  const handleMarkAsRead = async (
    notification: Notification
  ) => {
    if (notification.isRead) return;

    const token = getToken();

    if (!token) return;

    try {
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

      setUnreadCount((previous) =>
        Math.max(0, previous - 1)
      );
    } catch (err) {
      console.error("Mark as read error:", err);
      setError("Unable to update notification.");
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const token = getToken();

    if (!token || unreadCount === 0) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/read-all`,
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
          result.message || "Unable to mark all as read"
        );
      }

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read error:", err);
      setError("Unable to update notifications.");
    }
  };

  // Open notification and navigate
  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification);
    }

    setIsOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Teacher Logout
  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    localStorage.removeItem("commerceHubToken");
    localStorage.removeItem("commerceHubUser");

    router.replace("/login");
    router.refresh();
  };

  // Format notification date
  const formatDate = (date: string) => {
    const notificationDate = new Date(date);

    return notificationDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="relative z-30 flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-8">

      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {pageTitle}
        </h1>

        <p className="mt-1 text-xs text-slate-500">
          Welcome to Commerce Hub Kota Teacher Portal
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3 md:gap-5">

        {/* Notifications */}
        <div className="relative">

          <button
            type="button"
            onClick={() => {
              setIsOpen((previous) => !previous);

              if (!isOpen) {
                fetchNotifications();
              }
            }}
            aria-label="Notifications"
            aria-expanded={isOpen}
            className="relative rounded-full p-2 text-xl transition hover:bg-slate-100"
          >
            🔔

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isOpen && (
            <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-[380px]">

              {/* Dropdown Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                <div>
                  <h3 className="font-bold text-slate-800">
                    Notifications
                  </h3>

                  <p className="text-xs text-slate-500">
                    {unreadCount} unread notification
                    {unreadCount !== 1 ? "s" : ""}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">

                {loading && notifications.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    Loading notifications...
                  </div>
                )}

                {error && (
                  <div className="px-4 py-4 text-center text-sm text-red-500">
                    {error}
                  </div>
                )}

                {!loading &&
                  !error &&
                  notifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <div className="mb-2 text-3xl">
                        🔕
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        No notifications yet
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        You are all caught up!
                      </p>
                    </div>
                  )}

                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() =>
                      handleNotificationClick(notification)
                    }
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-blue-50 ${
                      !notification.isRead
                        ? "bg-blue-50/70"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">

                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg">
                        {notification.type === "QUESTION_ASSIGNED"
                          ? "📝"
                          : notification.type === "ANSWER_VERIFIED"
                          ? "✅"
                          : notification.type === "ANSWER_REJECTED"
                          ? "❌"
                          : notification.type === "SUBJECT_ASSIGNED"
                          ? "📚"
                          : "🔔"}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-2">

                          <p className="text-sm font-semibold text-slate-800">
                            {notification.title}
                          </p>

                          {!notification.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-[11px] text-slate-400">
                          {formatDate(notification.createdAt)}
                        </p>

                      </div>
                    </div>
                  </button>
                ))}

              </div>

              {/* Dropdown Footer */}
              <div className="border-t border-slate-100 px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/teacher/questions");
                  }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  View Student Questions
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Dynamic Teacher Profile */}
<div className="flex items-center gap-3">

  {/* Teacher Avatar */}
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold uppercase text-blue-700">
    {teacher?.name
      ? teacher.name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
      : "T"}
  </div>

  {/* Teacher Information */}
  <div className="hidden sm:block">
    <p className="text-sm font-semibold text-slate-800">
      {profileLoading
        ? "Loading..."
        : teacher?.name || "Teacher"}
    </p>

    <p className="text-xs text-slate-500">
      {teacher?.role
        ? teacher.role.charAt(0).toUpperCase() +
          teacher.role.slice(1)
        : "Faculty Member"}
    </p>
  </div>

</div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white md:px-4"
        >
          <span>↪</span>
          <span className="hidden sm:inline">Logout</span>
        </button>

      </div>
    </header>
  );
}
