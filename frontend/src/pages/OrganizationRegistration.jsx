import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/organization_registration.css';
import config from '../config';

const OrganizationRegistration = () => {
  const [formData, setFormData] = useState({
    organization_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('${config.API_URL}/public-org/register-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        alert('✅ Registration request submitted successfully! You will receive login credentials via email once approved by admin.');
      } else {
        console.error('Registration error details:', data);
        let errorMessage = data.message || 'Registration failed';
        
        // Show validation errors if available
        if (data.errors && data.errors.length > 0) {
          const validationErrors = data.errors.map(err => err.msg).join(', ');
          errorMessage += `\nValidation errors: ${validationErrors}`;
        }
        
        alert(`❌ Registration failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('❌ Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigate('/Role');
  };

  if (isSubmitted) {
    return (
      <div className="org-registration">
        <div className="success-container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h1>Request Submitted Successfully!</h1>
            <p>Thank you for your interest in joining Career Nest platform.</p>
            <div className="success-details">
              <h3>What happens next?</h3>
              <ul>
                <li>📧 Our admin team will review your application</li>
                <li>🔍 We'll verify your organization details</li>
                <li>📬 You'll receive login credentials via email once approved</li>
                <li>🚀 Start managing students and events on our platform</li>
              </ul>
            </div>
            <div className="success-actions">
              <button onClick={goBack} className="back-btn">
                🏠 Back to Home
              </button>
            </div>
            <p className="success-note">
              💡 Tip: Check your email regularly for approval updates
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-registration">
      <div className="registration-container">
        <header className="registration-header">
          <button onClick={goBack} className="back-button">
            ← Back
          </button>
          <h1>🏢 Organization Registration Request</h1>
          <p>Apply to join Career Nest platform for student management</p>
        </header>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-section">
            <h3>📋 Organization Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="organization_name">Organization Name *</label>
                <input
                  type="text"
                  id="organization_name"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your organization name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact_person">Contact Person *</label>
                <input
                  type="text"
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleInputChange}
                  required
                  placeholder="Primary contact person name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="organization@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1-555-0123"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="website">Website URL</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://www.yourorganization.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                placeholder="Organization address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Organization Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Brief description of your organization and why you want to join Career Nest platform"
              />
            </div>
          </div>

          <div className="approval-info">
            <h3>🔒 Approval Process</h3>
            <div className="approval-steps">
              <div className="step">
                <span className="step-number">1</span>
                <div>
                  <h4>Submit Request</h4>
                  <p>Fill out this form with accurate information</p>
                </div>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <div>
                  <h4>Admin Review</h4>
                  <p>Our team will verify your organization details</p>
                </div>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <div>
                  <h4>Receive Credentials</h4>
                  <p>Get login credentials via email once approved</p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Submitting...' : '📤 Submit Registration Request'}
            </button>
          </div>

          <div className="form-note">
            <p>
              <strong>Note:</strong> All fields marked with * are required. 
              Your request will be reviewed by our admin team within 24-48 hours.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationRegistration;
