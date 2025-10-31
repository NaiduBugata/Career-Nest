import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/universal.css";

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="main-container"> {/* Added wrapper div */}
      {/* ===== Navigation ===== */}
      <header>
        <nav className="navbar">
          <div className="logo">
            Career<span>Nest</span>
          </div>
          <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
            <li>
              <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            </li>
            <li>
              <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            </li>
            <li>
              <a href="#help" onClick={() => setMenuOpen(false)}>Help</a>
            </li>
            <li>
              <Link to="/Role" className="btn" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            </li>
            {/* <li>
              <Link to="/register" className="btn primary" onClick={() => setMenuOpen(false)}>
                Sign Up
              </Link>
            </li> */}
          </ul>
          <div
            className="menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <i className="fas fa-bars">☰</i>
          </div>
        </nav>
      </header>

      {/* ===== Hero Section ===== */}
      <section className="hero">
        <div className="hero-content">
          <h1>Build Your Career with <span>Career Nest</span></h1>
          <p>
            Your one-stop platform to find jobs, connect with employers, and grow
            professionally.
          </p>
          <div className="hero-buttons">
            <Link to="/Role" className="btn primary">
              Get Started
            </Link>
            <a href="#features" className="btn">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section className="features" id="features">
        <h2>Why Choose Career Nest?</h2>
        <div className="feature-grid">
          <div className="feature">
            <i className="fas fa-briefcase">💼</i>
            <h3>Job Opportunities</h3>
            <p>Find jobs that match your skills and interests from top employers.</p>
          </div>
          <div className="feature">
            <i className="fas fa-file-alt">📄</i>
            <h3>Resume Builder</h3>
            <p>Create and showcase your professional profile with ease.</p>
          </div>
          <div className="feature">
            <i className="fas fa-handshake">🤝</i>
            <h3>Employer Connect</h3>
            <p>Connect directly with companies looking for talent like you.</p>
          </div>
          <div className="feature">
            <i className="fas fa-chart-line">📈</i>
            <h3>Career Growth</h3>
            <p>Access guidance and resources to boost your career journey.</p>
          </div>
        </div>
      </section>

      {/* ===== How It Works Section ===== */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Your Profile</h3>
            <p>Sign up and build your professional profile in minutes.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Explore & Apply</h3>
            <p>Browse through thousands of job opportunities.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Hired & Grow</h3>
            <p>Land your dream job and advance your career.</p>
          </div>
        </div>
      </section>

      {/* ===== Call to Action ===== */}
      <section className="cta">
        <h2>Ready to start your career journey?</h2>
        <Link to="/Role" className="btn primary">
          Join Now
        </Link>
      </section>

      {/* ===== Footer ===== */}
      <footer>
        <p>&copy; 2025 Career Nest. All rights reserved.</p>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms & Conditions</a>
        </div>
        <div className="socials">
          <a href="#">
            <i className="fab fa-facebook">f</i>
          </a>
          <a href="#">
            <i className="fab fa-twitter">t</i>
          </a>
          <a href="#">
            <i className="fab fa-linkedin">in</i>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;