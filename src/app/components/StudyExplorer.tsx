
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudyExplorer() {
  const [board, setBoard] = useState<"CBSE" | "RBSE">("CBSE");
  const [course, setCourse] = useState("11");
  const router = useRouter();

  const courses = [
    {
      id: "11",
      title: "Class 11",
      description: "Build your commerce fundamentals",
      icon: "📘",
    },
    {
      id: "12",
      title: "Class 12",
      description: "Prepare for your board examinations",
      icon: "📚",
    },
  ];

  return (
    <section className="section study-explorer" id="study-explorer">
      <div className="container">
        <div className="section-heading">
          <div className="section-tag">Find Your Study Material</div>
          <h2>Choose Your Board and Class</h2>
          <p>
            Select your education board and class to find relevant
            commerce questions, chapters and verified answers.
          </p>
        </div>

        <div className="explorer-box">
          <div className="explorer-step">
            <div className="explorer-step-number">01</div>
            <div>
              <h3>Select Your Education Board</h3>
              <p>Choose the board according to your syllabus.</p>
            </div>
          </div>

          <div className="board-grid">
            <button
              type="button"
              className={`board-card ${board === "CBSE" ? "active" : ""}`}
              onClick={() => setBoard("CBSE")}
              aria-pressed={board === "CBSE"}
            >
              <span className="board-icon">🏫</span>
              <span className="board-card-content">
                <strong>CBSE Board</strong>
                <small>Central Board of Secondary Education</small>
              </span>
              <span className="board-check">
                {board === "CBSE" ? "✓" : ""}
              </span>
            </button>

            <button
              type="button"
              className={`board-card ${board === "RBSE" ? "active" : ""}`}
              onClick={() => setBoard("RBSE")}
              aria-pressed={board === "RBSE"}
            >
              <span className="board-icon">🎓</span>
              <span className="board-card-content">
                <strong>RBSE Board</strong>
                <small>Rajasthan Board of Secondary Education</small>
              </span>
              <span className="board-check">
                {board === "RBSE" ? "✓" : ""}
              </span>
            </button>
          </div>

          <div className="explorer-divider" />

          <div className="explorer-step">
            <div className="explorer-step-number">02</div>
            <div>
              <h3>Select Your Class</h3>
              <p>Choose your current academic level.</p>
            </div>
          </div>

          <div className="class-grid">
            {courses.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`class-card ${course === item.id ? "active" : ""}`}
                onClick={() => setCourse(item.id)}
                aria-pressed={course === item.id}
              >
                <span className="class-icon">{item.icon}</span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
                <span className="class-arrow">→</span>
              </button>
            ))}
          </div>

          <div className="explorer-result">
            <div>
              <span>Your Selection</span>
              <strong>
                {board} Board · Class {course}
              </strong>
            </div>

            <button
              type="button"
              className="btn btn-primary"
             onClick={() =>
  router.push(`/register?board=${board}&courseLevel=${course}`)
}
            >
              Continue Learning →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
