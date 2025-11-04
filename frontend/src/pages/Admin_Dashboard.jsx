import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/universal.css';
import '../styles/admin_dashboard.css';
import config from '../config';

const Admin_Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('organizations');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Organizations state
  const [organizations, setOrganizations] = useState([]);
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  const [approvalCredentials, setApprovalCredentials] = useState(null);

  // Events state
  const [events, setEvents] = useState([]);
  // Form fields aligned with backend validation in backend/routes/adminRoutes.js
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'workshop',
    startDate: '',
    endDate: '',
    venue: '',
    maxParticipants: '',
    registrationDeadline: '',
    requirements: '',
    prizes: ''
  });

  // Students state
  const [students, setStudents] = useState([]);

  // Management modals state
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showOrgDetailsModal, setShowOrgDetailsModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [orgDetails, setOrgDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [editOrgForm, setEditOrgForm] = useState({ name: '', email: '', phone: '' });
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const API_BASE = config.API_URL;

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Generate a strong password and fill the input
  const generateStrongPassword = () => {
    const length = 12;
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%^&*()-_=+[]{}';
    const all = upper + lower + digits + symbols;
    const pick = (set) => set[Math.floor(Math.random() * set.length)];

    // Ensure complexity: at least one of each
    let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
    for (let i = pwd.length; i < length; i++) {
      pwd += pick(all);
    }
    // Simple shuffle
    pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');
    setNewPassword(pwd);
  };

  const copyNewPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    alert('📋 New password copied to clipboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  // Fetch pending organizations
  const fetchPendingOrganizations = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/pending-organizations`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingOrganizations(data.data || []);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Error fetching pending organizations:', err.message || response.statusText);
      }
    } catch (error) {
      console.error('Error fetching pending organizations:', error);
    }
  };

  // Fetch all organizations
  const fetchAllOrganizations = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/organizations`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.data || []);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Error fetching organizations:', err.message || response.statusText);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  // Fetch all events
  const fetchAllEvents = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/events`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Error fetching events:', err.message || response.statusText);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Fetch all students
  const fetchAllStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/students`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Error fetching students:', err.message || response.statusText);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Approve organization
  const approveOrganization = async (requestId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/approve-organization`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId })
      });

      if (response.ok) {
        const data = await response.json();
        // Map backend response to UI-needed shape
        const d = data.data || {};
        setApprovalCredentials({
          organization: d.organizationName || 'Organization',
          username: d.username,
          password: d.password
        });
        fetchPendingOrganizations();
        fetchAllOrganizations();
        alert('✅ Organization approved successfully!');
      } else {
        const error = await response.json();
        alert(`❌ Failed to approve organization: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving organization:', error);
      alert('❌ Error approving organization');
    } finally {
      setIsLoading(false);
    }
  };

  // Reject organization
  const rejectOrganization = async (requestId, reason) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/reject-organization`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId, reason })
      });

      if (response.ok) {
        fetchPendingOrganizations();
        alert('Organization rejected successfully');
      } else {
        const error = await response.json();
        alert(`❌ Failed to reject organization: ${error.message}`);
      }
    } catch (error) {
      console.error('Error rejecting organization:', error);
      alert('❌ Error rejecting organization');
    } finally {
      setIsLoading(false);
    }
  };

  // Create global event
  const createGlobalEvent = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/admin/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventForm)
      });

      if (response.ok) {
        alert('✅ Global event created successfully!');
        setEventForm({
          title: '',
          description: '',
          type: 'workshop',
          startDate: '',
          endDate: '',
          venue: '',
          maxParticipants: '',
          registrationDeadline: '',
          requirements: '',
          prizes: ''
        });
        fetchAllEvents();
      } else {
        const error = await response.json();
        alert(`❌ Failed to create event: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('❌ Error creating event');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle event form input changes
  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Copy credentials to clipboard
  const copyCredentials = (credentials) => {
    const text = `Username: ${credentials.username}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
    alert('📋 Credentials copied to clipboard!');
  };

  // Fetch organization details
  const fetchOrganizationDetails = async (orgId) => {
    console.log('Fetching org details for ID:', orgId);
    console.log('Full URL:', `${API_BASE}/admin/organizations/${orgId}`);
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/admin/organizations/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        setOrgDetails(data.data);
        setShowOrgDetailsModal(true);
      } else {
        const err = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error response:', err);
        alert(`❌ ${err.message || 'Failed to fetch organization details'}`);
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
      alert('❌ Error fetching organization details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    console.log('Fetching user details for ID:', userId);
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      console.log('User details response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data.data.user);
        setShowUserDetailsModal(true);
      } else {
        const err = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error response:', err);
        alert(`❌ ${err.message || 'Failed to fetch user details'}`);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('❌ Error fetching user details');
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit organization modal
  const openEditOrgModal = (org) => {
    setSelectedOrg(org);
    setEditOrgForm({
      name: org.name || org.organization_name || '',
      email: org.email || '',
      phone: org.phone || ''
    });
    setShowEditOrgModal(true);
  };

  // Update organization details
  const updateOrganization = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/admin/organizations/${selectedOrg.id || selectedOrg._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editOrgForm)
      });
      if (response.ok) {
        alert('✅ Organization updated successfully!');
        setShowEditOrgModal(false);
        fetchAllOrganizations();
      } else {
        const err = await response.json();
        alert(`❌ ${err.message || 'Failed to update organization'}`);
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('❌ Error updating organization');
    } finally {
      setIsLoading(false);
    }
  };

  // Open change password modal
  const openChangePasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowChangePasswordModal(true);
  };

  // Change user password
  const changeUserPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('❌ Password must be at least 6 characters');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/admin/users/${selectedUser.id || selectedUser._id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword })
      });
      if (response.ok) {
        alert('✅ Password changed successfully!');
        setShowChangePasswordModal(false);
        setNewPassword('');
      } else {
        const err = await response.json();
        alert(`❌ ${err.message || 'Failed to change password'}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('❌ Error changing password');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.name || user.username}?`)) {
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/admin/users/${user.id || user._id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        alert(`✅ User ${action}d successfully!`);
        if (activeTab === 'students') {
          fetchAllStudents();
        } else {
          fetchAllOrganizations();
        }
      } else {
        const err = await response.json();
        alert(`❌ ${err.message || 'Failed to toggle user status'}`);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('❌ Error toggling user status');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'organizations':
        fetchPendingOrganizations();
        fetchAllOrganizations();
        break;
      case 'events':
        fetchAllEvents();
        break;
      case 'students':
        fetchAllStudents();
        break;
      default:
        break;
    }
  }, [activeTab]);

  return (
    <div className="admin-dashboard">
      {/* Global Navbar (same as other pages) */}
      <header>
        <nav className="navbar">
          <div className="logo">
            Career<span>Nest</span>
          </div>
          <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
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
              <button className="btn" onClick={() => { setMenuOpen(false); handleLogout(); }}>
                Logout
              </button>
            </li>
          </ul>
          <div
            className="menu-toggle"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            <i className="fas fa-bars">☰</i>
          </div>
        </nav>
      </header>

      {/* Page Header (Admin specific) */}
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p>Career Nest Platform Management</p>
      </div>

      <nav className="admin-nav">
        <button 
          className={activeTab === 'organizations' ? 'active' : ''} 
          onClick={() => setActiveTab('organizations')}
        >
          🏢 Organizations
        </button>
        <button 
          className={activeTab === 'events' ? 'active' : ''} 
          onClick={() => setActiveTab('events')}
        >
          📅 Global Events
        </button>
        <button 
          className={activeTab === 'students' ? 'active' : ''} 
          onClick={() => setActiveTab('students')}
        >
          🎓 Students
        </button>
        <button 
          className="courses-nav-btn"
          onClick={() => navigate('/courses')}
        >
          📚 Courses
        </button>
      </nav>

      <main className="admin-content">
        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="organizations-section">
            <h2>Organization Management</h2>

            {/* Pending Approvals */}
            <div className="pending-approvals">
              <h3>📋 Pending Approvals ({pendingOrganizations.length})</h3>
              {pendingOrganizations.length === 0 ? (
                <p className="no-data">No pending organization requests</p>
              ) : (
                <div className="requests-grid">
                  {pendingOrganizations.map(org => (
                    <div key={org.id} className="request-card">
                      <div className="request-header">
                        <h4>{org.organization_name}</h4>
                        <span className="status pending">Pending</span>
                      </div>
                      <div className="request-details">
                        <p><strong>Contact:</strong> {org.contact_person}</p>
                        <p><strong>Email:</strong> {org.email}</p>
                        <p><strong>Phone:</strong> {org.phone}</p>
                        <p><strong>Website:</strong> 
                          {org.website && (
                            <a href={org.website} target="_blank" rel="noopener noreferrer">
                              {org.website}
                            </a>
                          )}
                        </p>
                        <p><strong>Description:</strong> {org.description}</p>
                        <p><strong>Address:</strong> {org.address}</p>
                      </div>
                      <div className="request-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => approveOrganization(org.id)}
                          disabled={isLoading}
                        >
                          ✅ Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) rejectOrganization(org.id, reason);
                          }}
                          disabled={isLoading}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generated Credentials Modal */}
            {approvalCredentials && (
              <div className="credentials-modal">
                <div className="credentials-content">
                  <h3>🔐 Generated Credentials</h3>
                  <div className="credentials-info">
                    <p><strong>Organization:</strong> {approvalCredentials.organization}</p>
                    <p><strong>Username:</strong> <code>{approvalCredentials.username}</code></p>
                    <p><strong>Password:</strong> <code>{approvalCredentials.password}</code></p>
                  </div>
                  <div className="credentials-actions">
                    <button 
                      className="copy-btn"
                      onClick={() => copyCredentials(approvalCredentials)}
                    >
                      📋 Copy Credentials
                    </button>
                    <button 
                      className="close-btn"
                      onClick={() => setApprovalCredentials(null)}
                    >
                      Close
                    </button>
                  </div>
                  <p className="credentials-note">
                    ⚠️ Please share these credentials with the organization securely. 
                    They will not be shown again.
                  </p>
                </div>
              </div>
            )}

            {/* Approved Organizations */}
            <div className="approved-organizations">
              <h3>🏢 All Organizations ({organizations.length})</h3>
              {organizations.length === 0 ? (
                <p className="no-data">No organizations found</p>
              ) : (
                <div className="organizations-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Organization</th>
                        <th>Contact Person</th>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizations.map(org => (
                        <tr key={org.id}>
                          <td>{org.name || org.organization_name}</td>
                          <td>{org.contact_person || 'N/A'}</td>
                          <td>{org.email}</td>
                          <td><code>{org.username}</code></td>
                          <td>
                            <span className={`status ${org.isActive ? 'active' : 'inactive'}`}>
                              {org.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(org.created_at || org.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="action-btn view-btn"
                                onClick={() => {
                                  const orgId = org.id || org._id;
                                  console.log('Organization object:', org);
                                  console.log('Extracted ID:', orgId);
                                  if (!orgId) {
                                    alert('Error: Organization ID is missing');
                                    return;
                                  }
                                  fetchOrganizationDetails(orgId);
                                }}
                                title="View Details"
                              >
                                👁️
                              </button>
                              <button 
                                className="action-btn edit-btn"
                                onClick={() => openEditOrgModal(org)}
                                title="Edit Organization"
                              >
                                ✏️
                              </button>
                              <button 
                                className="action-btn password-btn"
                                onClick={() => openChangePasswordModal(org)}
                                title="Change Password"
                              >
                                🔑
                              </button>
                              <button 
                                className={`action-btn ${org.isActive ? 'deactivate-btn' : 'activate-btn'}`}
                                onClick={() => toggleUserStatus(org)}
                                title={org.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {org.isActive ? '🔴' : '🟢'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="events-section">
            <h2>Global Events Management</h2>

            {/* Create Global Event Form */}
            <div className="create-event-form">
              <h3>🌍 Create Global Event</h3>
              <form onSubmit={createGlobalEvent}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Event Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={eventForm.title}
                      onChange={handleEventInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="type">Event Type *</label>
                    <select
                      id="type"
                      name="type"
                      value={eventForm.type}
                      onChange={handleEventInputChange}
                      required
                    >
                      <option value="hackathon">Hackathon</option>
                      <option value="quiz">Quiz</option>
                      <option value="coding">Coding</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="conference">Conference</option>
                      <option value="competition">Competition</option>
                      <option value="webinar">Webinar</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={eventForm.description}
                    onChange={handleEventInputChange}
                    required
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date *</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={eventForm.startDate}
                      onChange={handleEventInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date *</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={eventForm.endDate}
                      onChange={handleEventInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="venue">Venue *</label>
                    <input
                      type="text"
                      id="venue"
                      name="venue"
                      value={eventForm.venue}
                      onChange={handleEventInputChange}
                      placeholder="Event venue or online platform"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="maxParticipants">Max Participants *</label>
                    <input
                      type="number"
                      id="maxParticipants"
                      name="maxParticipants"
                      value={eventForm.maxParticipants}
                      onChange={handleEventInputChange}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="registrationDeadline">Registration Deadline *</label>
                    <input
                      type="date"
                      id="registrationDeadline"
                      name="registrationDeadline"
                      value={eventForm.registrationDeadline}
                      onChange={handleEventInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="requirements">Requirements (optional)</label>
                    <input
                      type="text"
                      id="requirements"
                      name="requirements"
                      value={eventForm.requirements}
                      onChange={handleEventInputChange}
                      placeholder="Eligibility, equipment, etc."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="prizes">Prizes (optional)</label>
                  <input
                    type="text"
                    id="prizes"
                    name="prizes"
                    value={eventForm.prizes}
                    onChange={handleEventInputChange}
                    placeholder="Rewards, certificates, etc."
                  />
                </div>

                <button type="submit" className="create-event-btn" disabled={isLoading}>
                  {isLoading ? '⏳ Creating...' : '🌍 Create Global Event'}
                </button>
              </form>
            </div>

            {/* All Events List */}
            <div className="all-events">
              <h3>📅 All Events ({events.length})</h3>
              {events.length === 0 ? (
                <p className="no-data">No events found</p>
              ) : (
                <div className="events-grid">
                  {events.map(event => (
                    <div key={event.id} className="event-card">
                      <div className="event-header">
                        <h4>{event.title}</h4>
                        <div className="event-badges">
                          {event.is_global && <span className="badge global">🌍 Global</span>}
                          <span className={`badge mode-${event.mode}`}>
                            {event.mode === 'online' ? '💻' : event.mode === 'offline' ? '🏢' : '🔄'} 
                            {event.mode}
                          </span>
                        </div>
                      </div>
                      <p className="event-description">{event.description}</p>
                      <div className="event-details">
                        <p><strong>📅 Dates:</strong> {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</p>
                        {event.venue && <p><strong>📍 Venue:</strong> {event.venue}</p>}
                        <p><strong>👥 Participants:</strong> {event.registeredCount || 0} / {event.max_participants || '∞'}</p>
                        <p><strong>📊 Created by:</strong> {event.created_by_type || 'Admin'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="students-section">
            <h2>Students Management</h2>
            
            <div className="students-stats">
              <div className="stat-card">
                <h3>{students.length}</h3>
                <p>Total Students</p>
              </div>
              <div className="stat-card">
                <h3>{students.filter(s => s.status === 'active').length}</h3>
                <p>Active Students</p>
              </div>
            </div>

            {students.length === 0 ? (
              <p className="no-data">No students found</p>
            ) : (
              <div className="students-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Username</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Events Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td>{student.name || 'N/A'}</td>
                        <td>{student.email}</td>
                        <td><code>{student.username}</code></td>
                        <td>
                          <span className={`status ${student.isActive ? 'active' : 'inactive'}`}>
                            {student.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{new Date(student.created_at || student.createdAt).toLocaleDateString()}</td>
                        <td>{student.events_count || 0}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn view-btn"
                              onClick={() => fetchUserDetails(student.id || student._id)}
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button 
                              className="action-btn password-btn"
                              onClick={() => openChangePasswordModal(student)}
                              title="Change Password"
                            >
                              🔑
                            </button>
                            <button 
                              className={`action-btn ${student.isActive ? 'deactivate-btn' : 'activate-btn'}`}
                              onClick={() => toggleUserStatus(student)}
                              title={student.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {student.isActive ? '🔴' : '🟢'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Organization Details Modal */}
      {showOrgDetailsModal && orgDetails && (
        <div className="modal-overlay" onClick={() => setShowOrgDetailsModal(false)}>
          <div className="modal-content org-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏢 Organization Details</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedUser(orgDetails.organization);
                    setNewPassword('');
                    setShowNewPassword(false);
                    setShowChangePasswordModal(true);
                  }}
                >
                  🔑 Change Password
                </button>
                <button className="close-modal" onClick={() => setShowOrgDetailsModal(false)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="org-profile">
                <h3>Profile Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Name:</strong> {orgDetails.organization.name}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {orgDetails.organization.email}
                  </div>
                  <div className="info-item">
                    <strong>Username:</strong> <code>{orgDetails.organization.username}</code>
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong> {orgDetails.organization.phone || 'N/A'}
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong>
                    <span className={`status ${orgDetails.organization.isActive ? 'active' : 'inactive'}`}>
                      {orgDetails.organization.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Joined:</strong> {new Date(orgDetails.organization.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="org-stats">
                <h3>Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-number">{orgDetails.stats.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">{orgDetails.stats.totalEvents}</div>
                    <div className="stat-label">Total Events</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">{orgDetails.stats.totalAnnouncements}</div>
                    <div className="stat-label">Announcements</div>
                  </div>
                </div>
              </div>

              {orgDetails.recentStudents && orgDetails.recentStudents.length > 0 && (
                <div className="recent-students">
                  <h3>Recent Students ({orgDetails.recentStudents.length})</h3>
                  <div className="students-list">
                    {orgDetails.recentStudents.slice(0, 5).map(student => (
                      <div key={student._id} className="student-item">
                        <span>{student.name}</span>
                        <small>{student.rollNumber} - {student.course}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {orgDetails.recentEvents && orgDetails.recentEvents.length > 0 && (
                <div className="recent-events">
                  <h3>Recent Events ({orgDetails.recentEvents.length})</h3>
                  <div className="events-list">
                    {orgDetails.recentEvents.slice(0, 3).map(event => (
                      <div key={event._id} className="event-item">
                        <span>{event.title}</span>
                        <small>{new Date(event.startDate).toLocaleDateString()}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && userDetails && (
        <div className="modal-overlay" onClick={() => setShowUserDetailsModal(false)}>
          <div className="modal-content user-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 User Profile</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSelectedUser(userDetails);
                    setNewPassword('');
                    setShowNewPassword(false);
                    setShowChangePasswordModal(true);
                  }}
                >
                  🔑 Change Password
                </button>
                <button className="close-modal" onClick={() => setShowUserDetailsModal(false)}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="user-profile">
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Name:</strong> {userDetails.name}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {userDetails.email}
                  </div>
                  <div className="info-item">
                    <strong>Username:</strong> <code>{userDetails.username}</code>
                  </div>
                  <div className="info-item">
                    <strong>Role:</strong> {userDetails.role}
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong>
                    <span className={`status ${userDetails.isActive ? 'active' : 'inactive'}`}>
                      {userDetails.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="info-item">
                    <strong>Joined:</strong> {new Date(userDetails.createdAt).toLocaleDateString()}
                  </div>
                  
                  {userDetails.role === 'student' && (
                    <>
                      <div className="info-item">
                        <strong>Roll Number:</strong> {userDetails.rollNumber}
                      </div>
                      <div className="info-item">
                        <strong>Course:</strong> {userDetails.course}
                      </div>
                      <div className="info-item">
                        <strong>Year:</strong> {userDetails.year}
                      </div>
                      {userDetails.organization && (
                        <div className="info-item full-width">
                          <strong>Organization:</strong> {userDetails.organization.name}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditOrgModal && (
        <div className="modal-overlay" onClick={() => setShowEditOrgModal(false)}>
          <div className="modal-content edit-org-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Organization</h2>
              <button className="close-modal" onClick={() => setShowEditOrgModal(false)}>✕</button>
            </div>
            <form onSubmit={updateOrganization}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={editOrgForm.name}
                    onChange={(e) => setEditOrgForm({...editOrgForm, name: e.target.value})}
                    required
                    minLength={2}
                    maxLength={255}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editOrgForm.email}
                    onChange={(e) => setEditOrgForm({...editOrgForm, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={editOrgForm.phone}
                    onChange={(e) => setEditOrgForm({...editOrgForm, phone: e.target.value})}
                    maxLength={20}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowEditOrgModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowChangePasswordModal(false)}>
          <div className="modal-content change-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 Change Password</h2>
              <button className="close-modal" onClick={() => setShowChangePasswordModal(false)}>✕</button>
            </div>
            <form onSubmit={changeUserPassword}>
              <div className="modal-body">
                <p><strong>User:</strong> {selectedUser.name || selectedUser.username}</p>
                <div className="form-group">
                  <label>New Password (min 6 characters)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Enter new password"
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-secondary" onClick={() => setShowNewPassword(p => !p)}>
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={generateStrongPassword}>Generate</button>
                    <button type="button" className="btn-secondary" onClick={copyNewPassword}>Copy</button>
                  </div>
                </div>
                <p className="warning-text">⚠️ The user will need to use this new password to login.</p>
                <p className="warning-text">🔒 For security, existing passwords cannot be viewed. You can reset and share the new one.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowChangePasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin_Dashboard;