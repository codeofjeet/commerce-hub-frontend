import Link from "next/link";
import StudyExplorer from "./components/StudyExplorer";

const programs = [
  {
    icon: "📘",
    title: "Class 11 Commerce",
    description:
      "Build strong foundations in Accountancy, Economics and Business Studies.",
    color: "blue",
  },
  {
    icon: "📚",
    title: "Class 12 Commerce",
    description:
      "Prepare for board examinations with concepts, practice and revision.",
    color: "green",
  },
  {
    icon: "🎓",
    title: "B.Com",
    description:
      "Strengthen your understanding of commerce, finance and business.",
    color: "orange",
  },
  {
    icon: "🏆",
    title: "CA Foundation",
    description:
      "Develop the fundamentals required for your professional journey.",
    color: "purple",
  },
];

const subjects = [
  {
    icon: "🧮",
    title: "Accountancy",
    description: "Understand financial accounting and practical problems.",
    color: "tile-blue",
  },
  {
    icon: "📊",
    title: "Economics",
    description: "Explore microeconomics and macroeconomics.",
    color: "tile-green",
  },
  {
    icon: "💼",
    title: "Business Studies",
    description: "Learn management, business and organizational concepts.",
    color: "tile-orange",
  },
];

const features = [
  {
    number: "01",
    title: "Organized Question Bank",
    description:
      "Explore questions arranged by board, class, subject and chapter.",
  },
  {
    number: "02",
    title: "Verified Answers",
    description:
      "Learn with answers and explanations reviewed before publication.",
  },
  {
    number: "03",
    title: "Ask Your Questions",
    description:
      "Submit questions that are not available in the existing question bank.",
  },
  {
    number: "04",
    title: "Board-wise Learning",
    description:
      "Find academic content according to your CBSE or RBSE syllabus.",
  },
  {
    number: "05",
    title: "Chapter-wise Practice",
    description:
      "Focus on individual chapters and improve your understanding.",
  },
  {
    number: "06",
    title: "Learn at Your Pace",
    description:
      "Access your learning material whenever you need it.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Register as a student and get access to your learning dashboard.",
  },
  {
    number: "02",
    title: "Choose Your Learning Path",
    description:
      "Select your board, class, subject and chapter.",
  },
  {
    number: "03",
    title: "Learn and Practice",
    description:
      "Explore questions, read verified answers and ask new questions.",
  },
];

export default function Home() {
  return (
    <>
      
{/* HEADER */}
<header className="site-header">
  <div className="container navbar">
    <Link href="/" className="logo">
      <div className="logo-mark">C</div>
      <span>
        COMMERCE HUB
        <small>KOTA · LEARN · GROW</small>
      </span>
    </Link>

    {/* DESKTOP NAVIGATION */}
    <nav className="nav-links">
      <a href="#home">Home</a>
      <a href="#programs">Programs</a>
      <a href="#subjects">Subjects</a>
      <a href="#features">Features</a>
      <a href="#how-it-works">How It Works</a>
    </nav>

    <div className="nav-actions">
      <Link href="/login" className="btn btn-outline">
        Login
      </Link>
      <Link href="/register" className="btn btn-primary">
        Get Started
      </Link>
    </div>

    {/* MOBILE NAVIGATION */}
    <details className="mobile-menu">
      <summary aria-label="Toggle navigation menu">
        <span></span>
        <span></span>
        <span></span>
      </summary>

      <nav className="mobile-menu-links">
        <a href="#home">Home</a>
        <a href="#programs">Programs</a>
        <a href="#subjects">Subjects</a>
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>

        <div className="mobile-menu-buttons">
          <Link href="/login" className="btn btn-outline">
            Student Login
          </Link>
          <Link href="/register" className="btn btn-primary">
            Register Now
          </Link>
        </div>
      </nav>
    </details>
  </div>
</header>


      <main>
        {/* HERO */}
        <section className="hero" id="home">
          <div className="container hero-grid">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot"></span>
                YOUR COMMERCE LEARNING PLATFORM
              </div>

              <h1>
                Commerce Learning,
                <br />
                Made <span>Smarter.</span>
              </h1>

              <p className="hero-description">
                Learn concepts, explore chapter-wise questions, understand
                verified answers and prepare confidently for your examinations.
                Your journey towards commerce excellence starts here.
              </p>

              <div className="hero-buttons">
                <a href="/register" className="btn btn-primary">
                  Start Learning →
                </a>
                <a href="#programs" className="btn btn-outline">
                  Explore Programs
                </a>
              </div>

              <p className="hero-note">
                Designed for <strong>CBSE · RBSE · B.Com · CA Foundation</strong>
              </p>
            </div>

            {/* INFOGRAPHIC */}
            <div className="hero-visual">
              <div className="floating-card float-one">
                ✓ Verified Learning
                <small>Reviewed answers</small>
              </div>

              <div className="learning-board">
                <div className="board-top">
                  <strong>Your Learning Hub</strong>
                  <span className="board-label">LEARN DAILY</span>
                </div>

                <div className="board-subjects">
                  <div className="subject-tile tile-blue">
                    <span className="tile-icon">🧮</span>
                    <strong>Accountancy</strong>
                  </div>

                  <div className="subject-tile tile-green">
                    <span className="tile-icon">📊</span>
                    <strong>Economics</strong>
                  </div>

                  <div className="subject-tile tile-orange">
                    <span className="tile-icon">💼</span>
                    <strong>Business Studies</strong>
                  </div>

                  <div className="subject-tile tile-purple">
                    <span className="tile-icon">🎓</span>
                    <strong>CA Foundation</strong>
                  </div>
                </div>

                <div className="board-bottom">
                  <div>
                    <strong>Learn. Practice. Grow.</strong>
                    <br />
                    <span>Your path to better understanding</span>
                  </div>
                  <strong>↗</strong>
                </div>
              </div>

              <div className="floating-card float-two">
                📖 Chapter-wise Practice
                <small>Learn one topic at a time</small>
              </div>
            </div>
          </div>
        </section>

        <StudyExplorer />

        {/* PROGRAMS */}
        <section className="section" id="programs">
          <div className="container">
            <div className="section-heading">
              <div className="section-tag">Academic Programs</div>
              <h2>Choose Your Learning Path</h2>
              <p>
                From school-level commerce to professional courses, explore
                learning resources designed for your academic journey.
              </p>
            </div>

            <div className="program-grid">
              {programs.map((program) => (
                <div className="program-card" key={program.title}>
                  <div className="program-icon">{program.icon}</div>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <a href="/register" className="program-link">
                    Explore Program →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUBJECTS */}
        <section className="section subject-section" id="subjects">
          <div className="container">
            <div className="section-heading">
              <div className="section-tag">Explore Subjects</div>
              <h2>Master Your Commerce Subjects</h2>
              <p>
                Understand important concepts through organized questions,
                explanations and chapter-wise learning.
              </p>
            </div>

            <div className="subject-grid">
              {subjects.map((subject) => (
                <div className="subject-card" key={subject.title}>
                  <div className={`subject-icon ${subject.color}`}>
                    {subject.icon}
                  </div>

                  <div>
                    <h3>{subject.title}</h3>
                    <p>{subject.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="section" id="features">
          <div className="container">
            <div className="section-heading">
              <div className="section-tag">Platform Features</div>
              <h2>Everything You Need to Learn Better</h2>
              <p>
                A structured learning experience that helps students find
                relevant academic content and improve their preparation.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature) => (
                <div className="feature-card" key={feature.number}>
                  <div className="feature-number">{feature.number}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="section steps-section" id="how-it-works">
          <div className="container">
            <div className="section-heading">
              <div className="section-tag">Simple Learning Process</div>
              <h2>Start Learning in Three Steps</h2>
              <p>
                Getting started is simple. Follow these steps to access your
                commerce learning resources.
              </p>
            </div>

            <div className="steps-grid">
              {steps.map((step) => (
                <div className="step-card" key={step.number}>
                  <div className="step-circle">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-box">
              <h2>Ready to Strengthen Your Commerce Concepts?</h2>

              <p>
                Join Commerce Hub and start exploring organized questions,
                verified answers and learning resources.
              </p>

              <a href="/register" className="btn">
                Create Your Student Account →
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
             <Link
  href="/"
  className="logo"
  style={{ color: "white" }}
>
  <div className="logo-mark">C</div>
  <span>
    COMMERCE HUB
    <small>KOTA · LEARN · GROW</small>
  </span>
</Link>
              <p>
                Commerce Hub is a learning platform designed to help commerce
                students understand concepts, practice questions and prepare
                for academic success.
              </p>
            </div>

            <div>
              <h3 className="footer-title">Quick Links</h3>
              <div className="footer-links">
                <a href="#home">Home</a>
                <a href="#programs">Academic Programs</a>
                <a href="#subjects">Subjects</a>
                <a href="#features">Features</a>
              </div>
            </div>

            <div>
              <h3 className="footer-title">Student Account</h3>
              <div className="footer-links">
                <a href="/login">Student Login</a>
                <a href="/register">Student Registration</a>
                <a href="/login">Question Bank</a>
                <a href="/login">Student Dashboard</a>
              </div>
            </div>
          </div>

         <div className="footer-bottom">
  <p>© 2026 Commerce Hub. All rights reserved.</p>
  <p>Learn · Practice · Achieve</p>
</div>
        </div>
      </footer>
    </>
  );
}