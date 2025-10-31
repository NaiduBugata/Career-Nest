// RoleSelection.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/role.css';

const RoleSelection = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const roles = [
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage platform settings, users, and overall system operations.',
      icon: '👨‍💼',
      path: '/admin-login'
    },
    {
      id: 'organization',
      title: 'Organization/Institute',
      description: 'Apply to join Career Nest platform and manage student programs.',
      icon: '🏢',
      path: '/organization-register'
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Access career resources, connect with employers, and track your progress.',
      icon: '🎓',
      path: '/student-login'
    }
  ];

  const handleRoleSelect = (role) => {
    // Store the selected role for the specific login page
    localStorage.setItem('selectedRole', role.id);
    // Navigate to role-specific login page
    navigate(role.path);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="role-selection-container">
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
            {/* <li>
              <Link to="/AuthForm" className="btn" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            </li> */}
          </ul>
          <div
            className="menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            ☰
          </div>
        </nav>
      </header>

      <section className="role-hero">
        <div className="role-content">
          <h2>Select Your <span>Role</span></h2>
          <p>
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>
              Choose how you want to use CareerNest. You can always change this later.
            </span>
          </p>
          
          <div className="role-grid">
            {roles.map((role) => (
              <div 
                key={role.id}
                className="role-card"
                onClick={() => handleRoleSelect(role)}
              >
                <div className="role-icon">{role.icon}</div>
                <h3>{role.title}</h3>
                <p>{role.description}</p>
                <div className="role-select-button">
                  {role.id === 'organization' ? 'Apply to Join' : `Select ${role.title}`}
                </div>
                {role.id === 'organization' && (
                  <div className="existing-org-link">
                    <small>
                      Already have credentials? 
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem('selectedRole', 'organization');
                          navigate('/organization-login');
                        }}
                        style={{ color: '#FF4DD2', marginLeft: '5px' }}
                      >
                        Login here
                      </a>
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* <div className="role-buttons">
            <button className="btn" onClick={handleBack}>Back to Home</button>
          </div> */}
        </div>
      </section>

      <footer>
        <p>© 2025 CareerNest. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default RoleSelection;