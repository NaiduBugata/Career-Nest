import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/universal.css';
import '../styles/help.css';

const Help = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const faqData = {
    'getting-started': [
      {
        question: 'How do I create an account?',
        answer: 'Click on "Get Started" on the homepage, select your role (Student, Organization, or Admin), then click "Sign Up" and fill in the required information.'
      },
      {
        question: 'What roles are available?',
        answer: 'Career Nest offers three roles: Student (for learners), Organization (for educational institutions), and Admin (for platform administrators).'
      },
      {
        question: 'Is Career Nest free to use?',
        answer: 'Yes! Career Nest is completely free for students and organizations. We believe in making quality education accessible to everyone.'
      }
    ],
    'student': [
      {
        question: 'How do I enroll in a course?',
        answer: 'Navigate to the Courses section from your dashboard, browse available courses, and click "Enroll" on any course you\'re interested in.'
      },
      {
        question: 'How do I register for an event?',
        answer: 'Go to the Events section, browse available events, and click "Register" on the event you want to attend. You\'ll receive confirmation once registered.'
      },
      {
        question: 'Can I create my own events?',
        answer: 'Yes! Students can create private events, but they require approval from your organization before becoming active.'
      },
      {
        question: 'How do I track my course progress?',
        answer: 'Your dashboard displays all enrolled courses with progress indicators. You can also view detailed progress within each course page.'
      }
    ],
    'organization': [
      {
        question: 'How do I add students to my organization?',
        answer: 'You can add students individually through the "Add Student" form, or upload multiple students at once using our CSV/Excel bulk upload feature.'
      },
      {
        question: 'How do I create an announcement?',
        answer: 'Navigate to the Announcements section in your dashboard, click "Create Announcement", fill in the details, and submit. All your students will see it immediately.'
      },
      {
        question: 'How do I approve student-created events?',
        answer: 'Go to "Pending Events" section, review the event details, and choose to either approve or reject the event with optional feedback.'
      },
      {
        question: 'Can I create courses for my students?',
        answer: 'Yes! Organizations can create custom courses with video content, descriptions, and quizzes for their students.'
      }
    ],
    'courses': [
      {
        question: 'What types of courses are available?',
        answer: 'We offer courses in Web Development, Data Science, Mobile Development, Cloud Computing, DevOps, Cybersecurity, AI/ML, and many more categories.'
      },
      {
        question: 'Are the courses self-paced?',
        answer: 'Yes! All courses are self-paced, allowing you to learn at your own convenience and schedule.'
      },
      {
        question: 'Do I get a certificate after completing a course?',
        answer: 'Yes! Upon completing all course content and passing the quiz (if available), you\'ll receive a completion certificate.'
      },
      {
        question: 'Can I retake a quiz?',
        answer: 'Yes, you can retake quizzes multiple times to improve your score and understanding of the material.'
      }
    ],
    'technical': [
      {
        question: 'What browsers are supported?',
        answer: 'Career Nest works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser.'
      },
      {
        question: 'I forgot my password. What should I do?',
        answer: 'Click on "Forgot Password" on the login page, enter your email, and we\'ll send you instructions to reset your password.'
      },
      {
        question: 'Why am I getting a network error?',
        answer: 'Network errors usually occur due to internet connectivity issues or server maintenance. Please check your internet connection and try again. If the problem persists, contact support.'
      },
      {
        question: 'How do I update my profile information?',
        answer: 'Click on your profile icon in the dashboard, select "Edit Profile", make your changes, and click "Save".'
      }
    ]
  };

  const filteredFAQs = Object.keys(faqData).reduce((acc, section) => {
    const filtered = faqData[section].filter(
      faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[section] = filtered;
    }
    return acc;
  }, {});

  return (
    <div className="help-page">
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
      <section className="help-hero">
        <div className="help-hero-content">
          <h1>How Can We Help You?</h1>
          <p>Find answers to common questions and get support</p>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button>🔍</button>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="quick-links-section">
        <div className="container-help">
          <h2>Popular Topics</h2>
          <div className="quick-links-grid">
            <div className="quick-link-card" onClick={() => setActiveSection('getting-started')}>
              <div className="icon">🚀</div>
              <h3>Getting Started</h3>
              <p>Learn the basics</p>
            </div>
            <div className="quick-link-card" onClick={() => setActiveSection('student')}>
              <div className="icon">👨‍🎓</div>
              <h3>For Students</h3>
              <p>Student guides</p>
            </div>
            <div className="quick-link-card" onClick={() => setActiveSection('organization')}>
              <div className="icon">🏢</div>
              <h3>For Organizations</h3>
              <p>Organization help</p>
            </div>
            <div className="quick-link-card" onClick={() => setActiveSection('courses')}>
              <div className="icon">📚</div>
              <h3>Courses</h3>
              <p>Course-related help</p>
            </div>
            <div className="quick-link-card" onClick={() => setActiveSection('technical')}>
              <div className="icon">⚙️</div>
              <h3>Technical Support</h3>
              <p>Technical issues</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container-help">
          <div className="faq-header">
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className="faq-container">
            {/* Sidebar */}
            <div className="faq-sidebar">
              <h3>Categories</h3>
              <ul>
                <li
                  className={activeSection === 'getting-started' ? 'active' : ''}
                  onClick={() => setActiveSection('getting-started')}
                >
                  🚀 Getting Started
                </li>
                <li
                  className={activeSection === 'student' ? 'active' : ''}
                  onClick={() => setActiveSection('student')}
                >
                  👨‍🎓 Student Help
                </li>
                <li
                  className={activeSection === 'organization' ? 'active' : ''}
                  onClick={() => setActiveSection('organization')}
                >
                  🏢 Organization Help
                </li>
                <li
                  className={activeSection === 'courses' ? 'active' : ''}
                  onClick={() => setActiveSection('courses')}
                >
                  📚 Courses
                </li>
                <li
                  className={activeSection === 'technical' ? 'active' : ''}
                  onClick={() => setActiveSection('technical')}
                >
                  ⚙️ Technical Support
                </li>
              </ul>
            </div>

            {/* FAQ Content */}
            <div className="faq-content">
              {searchQuery ? (
                Object.keys(filteredFAQs).length > 0 ? (
                  Object.keys(filteredFAQs).map((section) => (
                    <div key={section}>
                      <h3 className="section-title">{section.replace('-', ' ').toUpperCase()}</h3>
                      {filteredFAQs[section].map((faq, index) => (
                        <div key={index} className="faq-item">
                          <h4>{faq.question}</h4>
                          <p>{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <p>No results found for "{searchQuery}"</p>
                    <p>Try different keywords or browse categories</p>
                  </div>
                )
              ) : (
                faqData[activeSection]?.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <h4>{faq.question}</h4>
                    <p>{faq.answer}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="contact-support">
        <div className="container-help">
          <h2>Still Need Help?</h2>
          <p>Can't find what you're looking for? Our support team is here to help!</p>
          <div className="contact-options">
            <div className="contact-card">
              <div className="icon">📧</div>
              <h3>Email Support</h3>
              <p>support@careernest.com</p>
              <p className="response-time">Response within 24 hours</p>
            </div>
            <div className="contact-card">
              <div className="icon">💬</div>
              <h3>Live Chat</h3>
              <p>Chat with our team</p>
              <p className="response-time">Available 9 AM - 6 PM</p>
              <button className="chat-button">Start Chat</button>
            </div>
            <div className="contact-card">
              <div className="icon">📞</div>
              <h3>Phone Support</h3>
              <p>+1 (555) 123-4567</p>
              <p className="response-time">Mon-Fri, 9 AM - 6 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Tutorials Section */}
      <section className="video-tutorials">
        <div className="container-help">
          <h2>Video Tutorials</h2>
          <div className="video-grid">
            <div className="video-card">
              <div className="video-thumbnail">🎥</div>
              <h4>Getting Started with Career Nest</h4>
              <p>5 min tutorial</p>
            </div>
            <div className="video-card">
              <div className="video-thumbnail">🎥</div>
              <h4>How to Enroll in Courses</h4>
              <p>3 min tutorial</p>
            </div>
            <div className="video-card">
              <div className="video-thumbnail">🎥</div>
              <h4>Managing Your Organization</h4>
              <p>7 min tutorial</p>
            </div>
            <div className="video-card">
              <div className="video-thumbnail">🎥</div>
              <h4>Creating and Managing Events</h4>
              <p>6 min tutorial</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="help-footer">
        <div className="container-help">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Career Nest</h3>
              <p>Your partner in career development and professional growth.</p>
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
              <h4>Resources</h4>
              <ul>
                <li><a href="#faq">FAQs</a></li>
                <li><a href="#tutorials">Video Tutorials</a></li>
                <li><a href="#contact">Contact Support</a></li>
              </ul>
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

export default Help;
