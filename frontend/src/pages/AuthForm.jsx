import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/universal.css';
import config from '../config';

// Custom styles for better form alignment
const formFieldStyle = {
  marginBottom: '25px',
  width: '100%'
};

const AuthForm = () => {
  const [isActive, setIsActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get selected role from localStorage on component mount
  React.useEffect(() => {
    const selectedRole = localStorage.getItem('selectedRole');
    if (selectedRole) {
      setUserRole(selectedRole);
    }
  }, []);

  const handleRegisterClick = () => setIsActive(true);
  const handleLoginClick = () => setIsActive(false);

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!userRole) {
      alert('⚠ Please select a role from the role selection page');
      navigate('/Role');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
          role: userRole
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Clear the stored role after successful login
        localStorage.removeItem('selectedRole');
        
        alert(data.message);
        navigate(data.redirect);
      } else {
        alert(`❌ Login failed: ${data.message}`);
        if (data.errors) {
          data.errors.forEach(error => console.error('Validation error:', error.msg));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('❌ Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!userRole) {
      alert('⚠ Please select a role from the role selection page');
      navigate('/Role');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
          role: userRole
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Registration successful! You can now login.');
        setIsActive(false); // Switch to login form
        setRegisterData({ username: '', email: '', password: '' }); // Clear form
      } else {
        alert(`❌ Registration failed: ${data.message}`);
        if (data.errors) {
          data.errors.forEach(error => console.error('Validation error:', error.msg));
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('❌ Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Navbar */}
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
          </ul>
          <div
            className="menu-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            ☰
          </div>
        </nav>
      </header>

      {/* Auth Form */}
      <div className={`container ${isActive ? 'active' : ''}`}>
        <div className="curved-shape"></div>
        <div className="curved-shape2"></div>

        {/* Login Form */}
        <div className="form-box Login">
          <h2>Login {userRole && <span style={{ fontSize: '14px', color: '#0c10cf', fontWeight: '400' }}>as {userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-field" style={formFieldStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', color: '#fff', fontWeight: '600', textAlign: 'left' }}>Username</label>
              <div className="input-box">
                <input
                  type="text"
                  name="username"
                  value={loginData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="form-field" style={formFieldStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', color: '#fff', fontWeight: '600', textAlign: 'left' }}>Password</label>
              <div className="input-box">
                <input
                  type="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            <div className="input-box">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            {/* Hide signup link for admin role */}
            {userRole !== 'admin' && (
              <div className="regi-link">
                <p>
                  Don't have an account? <br />
                  <a href="#" onClick={handleRegisterClick}>Sign Up</a>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Login Info */}
        <div className="info-content Login">
          <h2>WELCOME BACK!</h2>
          <p>Select your role and enter your credentials to continue.</p>
        </div>

        {/* Register Form */}
        <div className="form-box Register">
          <h2>Register {userRole && <span style={{ fontSize: '14px', color: '#0c10cf', fontWeight: '400' }}>as {userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>}</h2>
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-field" style={formFieldStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', color: '#fff', fontWeight: '600', textAlign: 'left' }}>Username</label>
              <div className="input-box">
                <input 
                  type="text" 
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  placeholder="Username" 
                  required 
                />
              </div>
            </div>
            <div className="form-field" style={formFieldStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', color: '#fff', fontWeight: '600', textAlign: 'left' }}>Email</label>
              <div className="input-box">
                <input 
                  type="email" 
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  placeholder="Email" 
                  required 
                />
              </div>
            </div>
            <div className="form-field" style={formFieldStyle}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', color: '#fff', fontWeight: '600', textAlign: 'left' }}>Password</label>
              <div className="input-box">
                <input 
                  type="password" 
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="Password (min 6 chars, 1 uppercase, 1 lowercase, 1 number)" 
                  required 
                />
              </div>
            </div>
            <div className="input-box">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
            <div className="regi-link">
              <p>
                Already have an account? <br />
                <a href="#" onClick={handleLoginClick}>Sign In</a>
              </p>
            </div>
          </form>
        </div>

        {/* Register Info */}
        <div className="info-content Register">
          <h2>WELCOME!</h2>
          <p>Create your account to join CareerNest.</p>
        </div>
      </div>
    </>
  );
};

export default AuthForm;