
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      if (!result.token || !result.user) {
        throw new Error("Invalid login response from server.");
      }

      localStorage.setItem("commerceHubToken", result.token);
      localStorage.setItem(
        "commerceHubUser",
        JSON.stringify(result.user)
      );

      alert("Login successful!");

      // Redirect according to user role
switch (result.user.role) {
  case "admin":
    router.push("/admin/evaluations");
    break;

  case "teacher":
    router.push("/teacher/evaluations");
    break;

  case "student":
    router.push("/student/dashboard");
    break;

  default:
    localStorage.removeItem("commerceHubToken");
    localStorage.removeItem("commerceHubUser");
    setError("Invalid user role.");
}
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <div className="register-card">
        <div className="register-heading">
          <span className="section-tag">
            Commerce Hub Student Account
          </span>

          <h1>Welcome Back</h1>

          <p>
            Login to explore questions, chapters and verified answers.
          </p>
        </div>

        <form onSubmit={handleLogin} className="register-form">
          <label htmlFor="email">Email Address</label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="register-error">{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary register-submit"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Login to Account →"}
          </button>
        </form>

        <p className="register-login">
          Do not have an account?{" "}
          <Link href="/register">Create an account</Link>
        </p>

        <p className="register-login">
          <Link href="/">← Back to Home</Link>
        </p>
      </div>
    </main>
  );
}
