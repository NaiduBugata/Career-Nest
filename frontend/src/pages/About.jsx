import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/universal.css';
import '../styles/about.css';

const About = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="about-page">
      {/* Header */}
      <header>
        <div className="logo">
          <Link to="/">Career Nest</Link>
        </div>
        <nav>
          <ul className={menuOpen ? 'show' : ''}>
            <li>
              <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            </li>
            <li>
              <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
            </li>
            <li>
              <Link to="/help" onClick={() => setMenuOpen(false)}>Help</Link>
            </li>
            <li>
              <Link to="/role" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </li>
          </ul>
          <div
            className="menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            ☰
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About Career Nest</h1>
          <p>Empowering Students, Connecting Opportunities</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="container-about">
          <div className="section-header">
            <h2>Our Mission</h2>
            <div className="divider"></div>
          </div>
          <p className="mission-text">
            Career Nest is dedicated to bridging the gap between students and professional opportunities. 
            We provide a comprehensive platform that connects educational institutions, organizations, 
            and students to facilitate career development, skill enhancement, and professional growth.
          </p>
        </div>
      </section>

      {/* Vision Section */}
      <section className="about-section alternate">
        <div className="container-about">
          <div className="section-header">
            <h2>Our Vision</h2>
            <div className="divider"></div>
          </div>
          <p className="vision-text">
            To create a world where every student has access to quality learning resources, 
            career guidance, and professional networking opportunities, regardless of their 
            geographical or economic background.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-section">
        <div className="container-about">
          <div className="section-header">
            <h2>What We Offer</h2>
            <div className="divider"></div>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Online Learning</h3>
              <p>Access to comprehensive courses across various domains with video-based learning and interactive quizzes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Event Management</h3>
              <p>Participate in workshops, seminars, conferences, and networking events organized by top institutions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏢</div>
              <h3>Organization Portal</h3>
              <p>Educational institutions can manage students, create events, and share announcements seamlessly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🎓</div>
              <h3>Student Dashboard</h3>
              <p>Personalized dashboard to track courses, events, announcements, and career progress.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your learning journey with detailed analytics and completion certificates.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Real-time Updates</h3>
              <p>Stay informed with instant notifications about new courses, events, and opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-section stats-section">
        <div className="container-about">
          <div className="section-header">
            <h2>Our Impact</h2>
            <div className="divider"></div>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>10,000+</h3>
              <p>Active Students</p>
            </div>
            <div className="stat-card">
              <h3>500+</h3>
              <p>Organizations</p>
            </div>
            <div className="stat-card">
              <h3>200+</h3>
              <p>Courses Available</p>
            </div>
            <div className="stat-card">
              <h3>1,000+</h3>
              <p>Events Conducted</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Values Section */}
      <section className="about-section alternate">
        <div className="container-about">
          <div className="section-header">
            <h2>Our Core Values</h2>
            <div className="divider"></div>
          </div>
          <div className="values-grid">
            <div className="value-item">
              <h4>🎓 Excellence</h4>
              <p>We strive for the highest quality in education and career development resources.</p>
            </div>
            <div className="value-item">
              <h4>🤝 Collaboration</h4>
              <p>We believe in the power of partnerships between students, institutions, and organizations.</p>
            </div>
            <div className="value-item">
              <h4>💡 Innovation</h4>
              <p>We continuously evolve our platform to meet the changing needs of the modern workforce.</p>
            </div>
            <div className="value-item">
              <h4>🌍 Accessibility</h4>
              <p>We ensure that quality education and opportunities are accessible to everyone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container-about">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join thousands of students building their careers with Career Nest</p>
          <Link to="/role" className="cta-button">Get Started Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="container-about">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Career Nest</h3>
              <p>Empowering students to build successful careers through quality education and professional opportunities.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/help">Help</Link></li>
                <li><Link to="/role">Get Started</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>Email: support@careernest.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Career Nest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
