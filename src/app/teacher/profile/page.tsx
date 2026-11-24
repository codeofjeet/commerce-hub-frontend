
"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Subject {
  _id: string;
  name: string;
  slug: string;
}

interface TeacherProfile {
  _id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  city?: string;
  role: string;
  isActive: boolean;
  assignedSubjects: Subject[];
  createdAt: string;
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [profileLoadingError, setProfileLoadingError] = useState("");

  // ==========================================
  // FETCH TEACHER PROFILE
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        const token = localStorage.getItem("commerceHubToken");

        if (!token) {
          setProfileLoadingError("Please log in to view your profile.");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/teachers/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load teacher profile."
          );
        }

        if (controller.signal.aborted) return;

        const teacher = result.data as TeacherProfile;

        setProfile(teacher);
        setName(teacher.name || "");
        setMobileNumber(teacher.mobileNumber || "");
        setCity(teacher.city || "");
      } catch (error) {
        if (controller.signal.aborted) return;

        setProfileLoadingError(
          error instanceof Error
            ? error.message
            : "Unable to load profile."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleProfileUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (name.trim().length < 2) {
      setProfileError("Name must contain at least 2 characters.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      setProfileError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (city.trim().length < 2) {
      setProfileError("City must contain at least 2 characters.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/api/teachers/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            mobileNumber: mobileNumber.trim(),
            city: city.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update profile."
        );
      }

      setProfile(result.data);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================

  const handlePasswordChange = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      const token = localStorage.getItem("commerceHubToken");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/api/teachers/change-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Password changed successfully."
      );
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <p className="animate-pulse text-slate-500">
          Loading teacher profile...
        </p>
      </div>
    );
  }

  if (profileLoadingError || !profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-700">
          {profileLoadingError || "Profile not found."}
        </p>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* PAGE HEADING */}
      <div>
        <p className="text-sm font-semibold text-blue-600">
          COMMERCE HUB KOTA
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          My Profile
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your personal information and account security.
        </p>
      </div>

      {/* PROFILE SUMMARY */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-5">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">
              {profile.name}
            </h2>

            <p className="mt-1 text-slate-500">
              {profile.email}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Teacher
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  profile.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {profile.isActive ? "Active Account" : "Inactive Account"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">
              Account Created
            </p>

            <p className="mt-1 font-semibold text-slate-700">
              {new Date(profile.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-slate-400">
              Assigned Subjects
            </p>

            <p className="mt-1 font-semibold text-slate-700">
              {profile.assignedSubjects.length} Subjects
            </p>
          </div>
        </div>
      </section>

      {/* EDIT PROFILE */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update your name, mobile number and city.
          </p>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={100}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <input
              type="email"
              value={profile.email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
            />

            <p className="mt-1 text-xs text-slate-400">
              Email address cannot be changed here.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mobile Number
              </label>

              <input
                type="tel"
                value={mobileNumber}
                onChange={(event) =>
                  setMobileNumber(event.target.value)
                }
                maxLength={10}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                City
              </label>

              <input
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
                maxLength={100}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {profileError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {profileError}
            </p>
          )}

          {profileMessage && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {profileMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      {/* ASSIGNED SUBJECTS */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">
          Assigned Subjects
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Subjects assigned to you by the administrator.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {profile.assignedSubjects.length === 0 ? (
            <p className="text-sm text-slate-500">
              No subjects assigned yet.
            </p>
          ) : (
            profile.assignedSubjects.map((subject) => (
              <div
                key={subject._id}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
              >
                <p className="font-semibold text-blue-800">
                  📚 {subject.name}
                </p>

                <p className="mt-1 text-xs text-blue-600">
                  {subject.slug}
                </p>
              </div>
            ))
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Contact your administrator if you need to change
          your assigned subjects.
        </p>
      </section>

      {/* CHANGE PASSWORD */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            Change Password
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Use your current password to set a new password.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Current Password
            </label>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              required
              maxLength={72}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-slate-400">
              Minimum 8 characters.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {passwordError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {passwordError}
            </p>
          )}

          {passwordMessage && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {passwordMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {changingPassword
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </section>

    </div>
  );
}
