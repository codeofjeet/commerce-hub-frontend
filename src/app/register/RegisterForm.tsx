
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");

  // Board and course selections
  const [board, setBoard] = useState(
    searchParams.get("board") || ""
  );

  const [courseLevel, setCourseLevel] = useState(
    searchParams.get("courseLevel") || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!board || !courseLevel) {
      setError("Please select your board and class/course.");
      return;
    }

    if (
      !dateOfBirth ||
      dateOfBirth >= new Date().toISOString().slice(0, 10)
    ) {
      setError("Please enter a valid date of birth.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            mobileNumber,
            city,
            dateOfBirth,
            board,
            classLevel: courseLevel,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const validationMessage = result.errors
          ?.map((item: { message: string }) => item.message)
          .join(", ");

        throw new Error(
          validationMessage ||
            result.message ||
            "Registration failed."
        );
      }

      alert("Registration successful! Please log in.");
      router.push("/login");
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

  return (
    <main className="register-page">
      <div className="register-card">

        <div className="register-heading">
          <span className="section-tag">
            Commerce Hub Student Account
          </span>

          <h1>Create Your Account</h1>

          <p>
            Register to explore questions, chapters and verified answers.
          </p>
        </div>

        {/* Academic Selection */}
        <div className="register-form">

          <label htmlFor="board">Select Board</label>

          <select
            id="board"
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            required
          >
            <option value="">Choose your board</option>
            <option value="CBSE">CBSE</option>
            <option value="RBSE">RBSE</option>
          </select>

          <label htmlFor="courseLevel">Select Class / Course</label>

          <select
            id="courseLevel"
            value={courseLevel}
            onChange={(e) => setCourseLevel(e.target.value)}
            required
          >
            <option value="">Choose your class/course</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
            <option value="BCom">B.Com</option>
            <option value="CA_FOUNDATION">CA Foundation</option>
          </select>

        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="register-form">

          <label htmlFor="name">Full Name</label>

          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={100}
            required
          />

          <label htmlFor="email">Email Address</label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="mobileNumber">Mobile Number</label>

          <input
            id="mobileNumber"
            type="tel"
            inputMode="numeric"
            placeholder="Enter 10-digit mobile number"
            value={mobileNumber}
            onChange={(e) =>
              setMobileNumber(
                e.target.value.replace(/\D/g, "").slice(0, 10)
              )
            }
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            required
          />

          <label htmlFor="city">City</label>

          <input
            id="city"
            type="text"
            placeholder="Enter your city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            minLength={2}
            maxLength={100}
            required
          />

          <label htmlFor="dateOfBirth">Date of Birth</label>

          <input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={72}
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
            {loading ? "Creating Account..." : "Create Account →"}
          </button>

        </form>

        <p className="register-login">
          Already have an account?{" "}
          <a href="/login">Login here</a>
        </p>

      </div>
    </main>
  );
}
