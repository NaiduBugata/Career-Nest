import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/student_dashboard.css';
import CoursesEmbedded from './CoursesEmbedded';

// Create Event Form Component
const CreateEventForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'workshop',
    start_date: '',
    end_date: '',
    venue: '',
    max_participants: '',
    requirements: '',
    prizes: '',
    registration_deadline: '',
    visibility: 'public',
    // extras
    quizQuestions: [],
    problemStatementText: '',
    problemStatementLink: ''
  });

  // Auto-seed one quiz question when switching to quiz type
  useEffect(() => {
    if (formData.type === 'quiz' && (!formData.quizQuestions || formData.quizQuestions.length === 0)) {
      setFormData(prev => ({
        ...prev,
        quizQuestions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }]
      }));
    }
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate dates
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const regDeadline = new Date(formData.registration_deadline);
    const today = new Date();

    if (startDate <= today) {
      alert('Start date must be in the future');
      return;
    }

    if (endDate < startDate) {
      alert('End date must be after start date');
      return;
    }

    if (regDeadline >= startDate) {
      alert('Registration deadline must be before the event start date');
      return;
    }

    // Build requirements payload based on type
    let requirementsPayload = formData.requirements || '';
    if (formData.type === 'quiz') {
      if (!Array.isArray(formData.quizQuestions) || formData.quizQuestions.length === 0) {
        alert('Please add at least one quiz question');
        return;
      }
      requirementsPayload = JSON.stringify({ kind: 'quiz', questions: formData.quizQuestions });
    } else if (formData.type === 'hackathon') {
      const psText = (formData.problemStatementText || '').trim();
      const psLink = (formData.problemStatementLink || '').trim();
      if (!psText && !psLink) {
        alert('Please provide a problem statement text or a link');
        return;
      }
      requirementsPayload = JSON.stringify({ kind: 'hackathon', problemStatementText: psText || undefined, problemStatementLink: psLink || undefined });
    }

    const payload = { ...formData, requirements: requirementsPayload };
    onSubmit(payload);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'workshop',
      start_date: '',
      end_date: '',
      venue: '',
      max_participants: '',
      requirements: '',
      prizes: '',
      registration_deadline: '',
      visibility: 'public'
    });
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Event Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter event title"
          />
        </div>
        <div className="form-group">
          <label>Event Type *</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="hackathon">Hackathon</option>
            <option value="coding">Coding Competition</option>
            <option value="quiz">Quiz</option>
            <option value="conference">Conference</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="4"
          placeholder="Describe your event..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Start Date *</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>End Date *</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Venue *</label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            required
            placeholder="Event venue"
          />
        </div>
        <div className="form-group">
          <label>Max Participants *</label>
          <input
            type="number"
            name="max_participants"
            value={formData.max_participants}
            onChange={handleChange}
            required
            min="1"
            placeholder="Maximum participants"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Registration Deadline *</label>
        <input
          type="date"
          name="registration_deadline"
          value={formData.registration_deadline}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Requirements</label>
        <textarea
          name="requirements"
          value={formData.requirements}
          onChange={handleChange}
          rows="3"
          placeholder="Any requirements or prerequisites..."
        />
      </div>

      <div className="form-group">
        <label>Prizes</label>
        <textarea
          name="prizes"
          value={formData.prizes}
          onChange={handleChange}
          rows="3"
          placeholder="Prize information..."
        />
      </div>

      {/* Conditional inputs based on type */}
      {formData.type === 'quiz' && (
        <div className="form-group">
          <label>Quiz Questions</label>
          <QuizBuilder
            questions={formData.quizQuestions}
            onChange={(qs) => setFormData(prev => ({ ...prev, quizQuestions: qs }))}
          />
        </div>
      )}

      {formData.type === 'hackathon' && (
        <div className="form-group">
          <label>Problem Statement</label>
          <textarea
            name="problemStatementText"
            value={formData.problemStatementText}
            onChange={handleChange}
            rows="4"
            placeholder="Paste problem statement here..."
          />
          <div style={{ marginTop: '0.5rem' }}>
            <label>Or provide a link</label>
            <input
              type="url"
              name="problemStatementLink"
              value={formData.problemStatementLink}
              onChange={handleChange}
              placeholder="https://example.com/problem-statement.pdf"
            />
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Tip: We will soon support direct file uploads. For now, use text or a link.
          </p>
        </div>
      )}

      <div className="form-group">
        <label>Event Visibility *</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={formData.visibility === 'public'}
              onChange={handleChange}
            />
            <span>🌐 Public (Requires organization approval)</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={formData.visibility === 'private'}
              onChange={handleChange}
            />
            <span>🔒 Private (Generates invite code)</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={resetForm} className="btn-secondary">
          Reset
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

// Inline QuizBuilder reused here
const QuizBuilder = ({ questions = [], onChange }) => {
  const addQuestion = () => {
    const next = [...questions, { question: '', options: ['', '', '', ''], correctIndex: 0 }];
    onChange(next);
  };
  const updateQuestion = (idx, value) => {
    const next = questions.map((q, i) => (i === idx ? { ...q, question: value } : q));
    onChange(next);
  };
  const updateOption = (qIdx, optIdx, value) => {
    const next = questions.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[optIdx] = value;
      return { ...q, options: opts };
    });
    onChange(next);
  };
  const setCorrect = (qIdx, idx) => {
    const next = questions.map((q, i) => (i === qIdx ? { ...q, correctIndex: idx } : q));
    onChange(next);
  };
  const removeQuestion = (idx) => {
    const next = questions.filter((_, i) => i !== idx);
    onChange(next);
  };
  return (
    <div className="quiz-builder">
      {questions.length === 0 && (
        <div className="no-data" style={{ marginBottom: '0.5rem' }}>No questions yet.</div>
      )}
      {questions.map((q, qi) => (
        <div key={qi} className="quiz-question-card" style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontWeight: 600 }}>Question {qi + 1}</label>
            <button type="button" className="btn-secondary" onClick={() => removeQuestion(qi)}>Remove</button>
          </div>
          <input
            type="text"
            value={q.question}
            onChange={(e) => updateQuestion(qi, e.target.value)}
            placeholder="Enter question"
            style={{ marginTop: 6 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {q.options.map((opt, oi) => (
              <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="radio"
                  name={`s-correct-${qi}`}
                  checked={q.correctIndex === oi}
                  onChange={() => setCorrect(qi, oi)}
                  title="Mark correct"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  placeholder={`Option ${oi + 1}`}
                  style={{ flex: 1 }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={addQuestion}>+ Add Question</button>
    </div>
  );
};

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [membership, setMembership] = useState({ memberships: [], hasActive: false });
  const effectiveHasOrg = Boolean(membership?.hasActive || user?.organization_name || user?.organization || user?.organization_id);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventCode, setEventCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [createdEventCode, setCreatedEventCode] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/Role');
    }
    // Soft-refresh profile to enrich with organization info (if available)
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const resp = await fetch('http://localhost:8000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (resp.ok) {
          const body = await resp.json();
          if (body?.success && body?.user) {
            setUser(body.user);
            localStorage.setItem('user', JSON.stringify(body.user));
          }
        }
      } catch (e) {
        // non-fatal, ignore
      }
    })();
    
    // Load student-specific data
    loadStudentData();
    loadCreatedEvents();
  }, [navigate]);

  const loadStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load announcements visible to this student
      const announcementsResponse = await fetch('http://localhost:8000/api/student/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (announcementsResponse.ok) {
        const announcementsData = await announcementsResponse.json();
        setAnnouncements(announcementsData.data || []);
      }

      // Load events available to this student
      const eventsResponse = await fetch('http://localhost:8000/api/student/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.data || []);
      }

      // Load registered events
      const registeredResponse = await fetch('http://localhost:8000/api/student/registered-events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (registeredResponse.ok) {
        const registeredData = await registeredResponse.json();
        setRegisteredEvents(registeredData.data || []);
      }

      // Load membership status
      const membershipResp = await fetch('http://localhost:8000/api/student/membership', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (membershipResp.ok) {
        const m = await membershipResp.json();
        setMembership(m.data || { memberships: [], hasActive: false });
      }

    } catch (error) {
      console.error('Error loading student data:', error);
      // Fallback to mock data if API fails
      loadMockData();
    }
  };

  const loadMockData = () => {
    // Fallback mock data
    setAnnouncements([
      {
        id: 1,
        title: 'Welcome to TechCorp Internship Program',
        content: 'We are excited to announce the start of our internship program.',
        priority: 'high',
        created_at: new Date().toISOString(),
        author: 'TechCorp HR'
      }
    ]);

    setEvents([
      {
        id: 1,
        title: 'TechCorp Annual Hackathon 2025',
        description: 'Join our flagship hackathon event.',
        type: 'hackathon',
        start_date: '2025-12-15',
        end_date: '2025-12-17',
        venue: 'TechCorp Campus',
        max_participants: 100,
        registeredCount: 45
      }
    ]);
  };

  // Load student's created events
  const loadCreatedEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/student/created-events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error loading created events:', error);
    }
  };

  // Create new event
  const handleCreateEvent = async (eventData) => {
    // Guard: require active organization membership first
    if (!effectiveHasOrg) {
      alert('❌ Event creation failed: You must belong to an organization to create events.\n\nIf you were just added by your organization, please log out and sign in again to refresh your membership, then try again.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/student/create-event', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();
      if (data.success) {
        // For private events, surface the generated code in a modal for easy copy
        if (eventData.visibility === 'private' && (data.data?.eventCode || /Event code:\s*([A-Z0-9]+)/i.test(data.message))) {
          const code = data.data?.eventCode || (data.message.match(/Event code:\s*([A-Z0-9]+)/i) || [])[1] || '';
          if (code) {
            setCreatedEventCode(code);
            setShowCodeModal(true);
          }
        } else {
          alert(`✅ ${data.message}`);
        }
        setShowEventModal(false);
        loadCreatedEvents(); // Reload created events
        if (eventData.visibility === 'public') {
          alert('📋 Your public event has been submitted for approval by your organization.');
        }
      } else {
        // Show detailed validation errors if provided
        const details = Array.isArray(data.errors)
          ? '\n- ' + data.errors.map(e => `${e.param}: ${e.msg}`).join('\n- ')
          : '';
        alert(`❌ Event creation failed: ${data.message || 'Unknown error'}${details}`);
      }
    } catch (error) {
      alert('❌ Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Join private event using code
  const handleJoinPrivateEvent = async () => {
    if (!eventCode.trim()) {
      alert('Please enter an event code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/student/join-private-event', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventCode: eventCode.trim().toUpperCase() })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        setEventCode('');
        loadStudentData(); // Reload to show new registered event
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      alert('❌ Failed to join private event');
    } finally {
      setLoading(false);
    }
  };

  const handleEventRegistration = async (eventId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/organization/register-event', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId })
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Successfully registered for the event!');
        loadStudentData(); // Reload data to update registration status
      } else {
        alert(`❌ Registration failed: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const [profileOpen, setProfileOpen] = useState(false);
  const toggleProfile = () => setProfileOpen(p => !p);
  const goToProfile = () => {
    setProfileOpen(false);
    navigate('/profile');
  };
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const usernameChangedFlag = () => {
    // check backend-provided flag or localStorage fallback
    const fromUser = user?.username_changed;
    const fromLocal = localStorage.getItem('username_changed');
    return Boolean(fromUser) || fromLocal === 'true';
  };

  const isEventRegistered = (eventId) => {
    return registeredEvents.some(regEvent => regEvent.event_id === eventId || regEvent.id === eventId);
  };

  return (
    <div className="student-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            Career<span>Nest</span>
          </div>
          <div className="header-right">
            <button className="logout-btn" onClick={handleLogout} aria-label="Logout">Logout</button>
            <div className="profile-wrapper">
              <button className="profile-btn" onClick={toggleProfile} aria-haspopup="true" aria-expanded={profileOpen}>
                <div className="avatar">{(user?.name || user?.username || 'U')[0].toUpperCase()}</div>
              </button>
              {/* Profile Drawer (slides from right) */}
              <div className={`profile-backdrop ${profileOpen ? 'open' : ''}`} onClick={() => setProfileOpen(false)} />
              <aside className={`profile-drawer ${profileOpen ? 'open' : ''}`} role="dialog" aria-label="Profile drawer">
                <div className="profile-drawer-header">
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="avatar large">{(user?.name || user?.username || 'U')[0].toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{user?.name || user?.username}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>@{user?.username}</div>
                    </div>
                  </div>
                  <button className="close-drawer" onClick={() => setProfileOpen(false)}>✕</button>
                </div>

                <div className="profile-drawer-body">
                  <div className="profile-row"><strong>Email:</strong><span>{user?.email || '—'}</span></div>
                  <div className="profile-row"><strong>Role:</strong><span>{user?.role || '—'}</span></div>
                  {user?.roll_number && <div className="profile-row"><strong>Roll No:</strong><span>{user?.roll_number}</span></div>}
                  {user?.organization_name && <div className="profile-row"><strong>Organization:</strong><span>{user?.organization_name}</span></div>}
                  {user?.phone && <div className="profile-row"><strong>Phone:</strong><span>{user?.phone}</span></div>}
                  {user?.created_at && <div className="profile-row"><strong>Joined:</strong><span>{new Date(user.created_at).toLocaleDateString()}</span></div>}

                  <div style={{ marginTop: '0.5rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.4rem' }}>Change username (one-time)</strong>
                    {!usernameChangedFlag() ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {!editingUsername ? (
                          <button className="btn-secondary" onClick={() => { setNewUsername(user?.username || ''); setEditingUsername(true); }}>
                            Edit
                          </button>
                        ) : (
                          <>
                            <input
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}
                            />
                            <button
                              className="btn-primary"
                              onClick={async () => {
                                const trimmed = newUsername.trim();
                                if (!trimmed) { alert('Username cannot be empty'); return; }
                                // optimistic local update
                                const prevUser = { ...user };
                                const updatedUser = { ...user, username: trimmed };
                                setEditingUsername(false);
                                setUser(updatedUser);
                                localStorage.setItem('user', JSON.stringify(updatedUser));
                                localStorage.setItem('username_changed', 'true');

                                // attempt backend update if endpoint exists
                                try {
                                  const token = localStorage.getItem('token');
                                  const resp = await fetch('http://localhost:8000/api/auth/profile', {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ username: trimmed })
                                  });
                                  if (!resp.ok) {
                                    // revert local if backend rejected
                                    const err = await resp.json().catch(() => ({}));
                                    alert(err.message || 'Failed to update username on server; change saved locally.');
                                    // keep local change but mark flag — server didn't persist
                                  }
                                } catch (err) {
                                  // network or no endpoint — keep local change
                                  console.warn('Profile update failed (backend):', err.message || err);
                                }
                              }}
                            >Save</button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#6b7280', fontSize: '0.95rem' }}>Username change already used</div>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setProfileOpen(false); navigate('/profile'); }}>Edit Profile</button>
                  </div>

                  {/* Logout moved to top navigation */}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation Tabs */}
      <div className="dashboard-nav-wrapper">
        <nav className="dashboard-nav">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            data-tooltip="Overview"
          >
            <span className="tab-icon">📊</span>
            <span className="tab-text">Overview</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
            data-tooltip="Announcements"
          >
            <span className="tab-icon">📢</span>
            <span className="tab-text">Announcements</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
            data-tooltip="Available Events"
          >
            <span className="tab-icon">🎉</span>
            <span className="tab-text">Available Events</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
            data-tooltip="Courses"
          >
            <span className="tab-icon">📚</span>
            <span className="tab-text">Courses</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'create-event' ? 'active' : ''}`}
            onClick={() => setActiveTab('create-event')}
            data-tooltip="Create Event"
          >
            <span className="tab-icon">➕</span>
            <span className="tab-text">Create Event</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'my-events' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-events')}
            data-tooltip="My Events"
          >
            <span className="tab-icon">📅</span>
            <span className="tab-text">My Events</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'join-private' ? 'active' : ''}`}
            onClick={() => setActiveTab('join-private')}
            data-tooltip="Join Private Event"
          >
            <span className="tab-icon">🔐</span>
            <span className="tab-text">Join Private Event</span>
          </button>
          <button 
            className={`nav-tab ${activeTab === 'registered' ? 'active' : ''}`}
            onClick={() => setActiveTab('registered')}
            data-tooltip="My Registrations"
          >
            <span className="tab-icon">📝</span>
            <span className="tab-text">My Registrations</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Created Private Event Code Modal */}
        {showCodeModal && (
          <div className="modal-backdrop" onClick={() => setShowCodeModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🔒 Private Event Code</h3>
                <button className="close-modal" onClick={() => setShowCodeModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <p>Share this code with participants so they can join your private event:</p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <code style={{ fontSize: '1.1rem', background: '#F3F4F6', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>{createdEventCode}</code>
                  <button
                    className="btn-secondary"
                    onClick={() => { navigator.clipboard.writeText(createdEventCode); alert('📋 Code copied!'); }}
                  >Copy</button>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '1rem' }}>
                <button className="btn-primary" onClick={() => setShowCodeModal(false)}>Done</button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <h2>Welcome, {user?.name || user?.username}</h2>
            <p style={{ color: '#6b7280', marginTop: '0.4rem' }}>Here's what's happening with your account</p>
            <div style={{ marginTop: '0.5rem' }}>
              {effectiveHasOrg ? (
                <div style={{ color: '#065F46', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '8px 10px', borderRadius: '8px', display: 'inline-block' }}>
                  <strong>Organization:</strong> {user?.organization_name || (membership?.memberships?.[0]?.organization_name) || 'Your organization'}
                </div>
              ) : (
                <div style={{ color: '#92400E', background: '#FFF7ED', border: '1px solid #FDBA74', padding: '8px 10px', borderRadius: '8px', display: 'inline-block' }}>
                  No organization linked yet.
                </div>
              )}
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{announcements.length}</div>
                <div className="stat-label">New Announcements</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{events.length}</div>
                <div className="stat-label">Available Events</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{registeredEvents.length}</div>
                <div className="stat-label">My Registrations</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">85%</div>
                <div className="stat-label">Profile Completion</div>
              </div>
            </div>

            <div className="recent-activities">
              <h3>Recent Updates</h3>
              <div className="activity-list">
                {announcements.slice(0, 3).map(announcement => (
                  <div key={announcement.id} className="activity-item">
                    <span className="activity-icon">📢</span>
                    <span>{announcement.title}</span>
                    <span className="activity-time">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {events.slice(0, 2).map(event => (
                  <div key={event.id} className="activity-item">
                    <span className="activity-icon">🎉</span>
                    <span>New event: {event.title}</span>
                    <span className="activity-time">
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="courses-embedded">
            <CoursesEmbedded user={user} />
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="announcements-content">
            <div className="section-header">
              <h2>Organization Announcements</h2>
            </div>

            <div className="announcements-list">
              {announcements.length > 0 ? announcements.map(announcement => (
                <div key={announcement.id} className="announcement-card">
                  <div className="announcement-header">
                    <h3>{announcement.title}</h3>
                    <span className={`priority ${announcement.priority}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="announcement-content">{announcement.content}</p>
                  <div className="announcement-footer">
                    <span>By {announcement.author}</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <div className="no-data">
                  <p>No announcements available at the moment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="events-content">
            <div className="section-header">
              <h2>Available Events</h2>
            </div>

            <div className="events-grid">
              {events.length > 0 ? events.map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className="event-type">{event.type}</span>
                  </div>
                  <p className="event-description">{event.description}</p>
                  <div className="event-details">
                    <div className="event-detail">
                      <strong>Date:</strong> {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                    </div>
                    <div className="event-detail">
                      <strong>Venue:</strong> {event.venue}
                    </div>
                    <div className="event-detail">
                      <strong>Participants:</strong> {event.registeredCount || 0}/{event.max_participants}
                    </div>
                  </div>
                  <div className="event-actions">
                    {isEventRegistered(event.id) ? (
                      <button className="btn-registered" disabled>
                        ✅ Registered
                      </button>
                    ) : (
                      <button 
                        className="btn-register"
                        onClick={() => handleEventRegistration(event.id)}
                        disabled={loading}
                      >
                        {loading ? 'Registering...' : 'Register Now'}
                      </button>
                    )}
                    <button 
                      className="btn-details"
                      onClick={() => handleViewEventDetails(event)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )) : (
                <div className="no-data">
                  <p>No events available at the moment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Event Tab */}
        {activeTab === 'create-event' && (
          <div className="create-event-content">
            <div className="section-header">
              <h2>Create New Event</h2>
            </div>

            {!effectiveHasOrg && (
              <div className="alert warning" style={{
                background: '#FFF7ED',
                border: '1px solid #FDBA74',
                color: '#92400E',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <strong>Organization membership required.</strong>
                <div style={{ marginTop: '4px', fontSize: '0.95rem' }}>
                  You must belong to an organization to create events. Ask your organization admin to add you in their Students list using your email/roll number. If you were just added, log out and sign in again to refresh your membership, then try again.
                </div>
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        if (!token) return;
                        // refresh profile
                        const p = await fetch('http://localhost:8000/api/auth/profile', {
                          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                        });
                        if (p.ok) {
                          const body = await p.json();
                          if (body?.success && body?.user) {
                            setUser(body.user);
                            localStorage.setItem('user', JSON.stringify(body.user));
                          }
                        }
                        // refresh membership
                        const m = await fetch('http://localhost:8000/api/student/membership', {
                          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                        });
                        if (m.ok) {
                          const md = await m.json();
                          setMembership(md.data || { memberships: [], hasActive: false });
                        }
                        alert('🔄 Refreshed membership. If you were just added, this page should update now.');
                      } catch {}
                    }}
                  >
                    🔄 Refresh Membership
                  </button>
                </div>
              </div>
            )}

            <div className="create-event-form" aria-disabled={!effectiveHasOrg}>
              <fieldset disabled={!effectiveHasOrg} style={{ border: 'none', padding: 0, margin: 0 }}>
                <CreateEventForm onSubmit={handleCreateEvent} loading={loading} />
              </fieldset>
            </div>
          </div>
        )}

        {/* My Events Tab */}
        {activeTab === 'my-events' && (
          <div className="my-events-content">
            <div className="section-header">
              <h2>My Created Events</h2>
              <button 
                className="btn-primary"
                onClick={() => setActiveTab('create-event')}
              >
                ➕ Create New Event
              </button>
            </div>

            <div className="events-grid">
              {createdEvents.length > 0 ? createdEvents.map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <div className="event-meta">
                      <span className="event-type">{event.type}</span>
                      <span className={`event-status ${event.approval_status}`}>
                        {event.approval_status}
                      </span>
                      {event.visibility === 'private' && (
                        <span className="event-visibility">🔒 Private</span>
                      )}
                    </div>
                  </div>
                  <p className="event-description">{event.description}</p>
                  <div className="event-details">
                    <div className="event-detail">
                      <strong>Date:</strong> {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                    </div>
                    <div className="event-detail">
                      <strong>Venue:</strong> {event.venue}
                    </div>
                    <div className="event-detail">
                      <strong>Participants:</strong> {event.registered_count || 0}/{event.max_participants}
                    </div>
                    {event.event_code && (
                      <div className="event-detail">
                        <strong>Event Code:</strong> <code>{event.event_code}</code>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="no-data">
                  <p>You haven't created any events yet.</p>
                  <button 
                    className="btn-primary" 
                    onClick={() => setActiveTab('create-event')}
                  >
                    Create Your First Event
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join Private Event Tab */}
        {activeTab === 'join-private' && (
          <div className="join-private-content">
            <div className="section-header">
              <h2>Join Private Event</h2>
            </div>

            <div className="join-private-form">
              <div className="form-group">
                <label>Event Code</label>
                <input
                  type="text"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character event code"
                  maxLength="8"
                />
              </div>
              <button 
                className="btn-primary"
                onClick={handleJoinPrivateEvent}
                disabled={loading || !eventCode.trim()}
              >
                {loading ? 'Joining...' : 'Join Event'}
              </button>
              <div className="help-text">
                <p>Enter the event code provided by the event creator to join a private event.</p>
              </div>
            </div>
          </div>
        )}

        {/* My Registrations Tab */}
        {activeTab === 'registered' && (
          <div className="registered-content">
            <div className="section-header">
              <h2>My Event Registrations</h2>
            </div>

            <div className="registered-list">
              {registeredEvents.length > 0 ? registeredEvents.map(registration => (
                <div key={registration.id} className="registration-card">
                  <div className="registration-header">
                    <h3>{registration.title || registration.event_title}</h3>
                    <span className="registration-status">Registered</span>
                  </div>
                  <div className="registration-details">
                    <p><strong>Registration Date:</strong> {new Date(registration.registration_date).toLocaleDateString()}</p>
                    <p><strong>Event Date:</strong> {new Date(registration.start_date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {registration.status}</p>
                  </div>
                </div>
              )) : (
                <div className="no-data">
                  <p>You haven't registered for any events yet.</p>
                  <button 
                    className="btn-primary" 
                    onClick={() => setActiveTab('events')}
                  >
                    Browse Events
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Event Details Modal */}
      {showEventDetailsModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventDetailsModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEvent.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEventDetailsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <div className="event-detail-section">
                <div className="detail-badge" style={{ 
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, var(--accent-color), var(--highlight-color))',
                  color: 'white',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  {selectedEvent.type}
                </div>
                
                <h4 style={{ color: 'var(--text-primary)', marginTop: '1rem', marginBottom: '0.5rem' }}>Description</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedEvent.description}</p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem',
                  marginTop: '1.5rem'
                }}>
                  <div className="detail-item">
                    <strong style={{ color: 'var(--text-primary)' }}>📅 Start Date:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {new Date(selectedEvent.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="detail-item">
                    <strong style={{ color: 'var(--text-primary)' }}>📅 End Date:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {new Date(selectedEvent.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="detail-item">
                    <strong style={{ color: 'var(--text-primary)' }}>📍 Venue:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {selectedEvent.venue}
                    </p>
                  </div>
                  
                  <div className="detail-item">
                    <strong style={{ color: 'var(--text-primary)' }}>👥 Max Participants:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {selectedEvent.max_participants}
                    </p>
                  </div>
                  
                  <div className="detail-item">
                    <strong style={{ color: 'var(--text-primary)' }}>📊 Registered:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {selectedEvent.registeredCount || 0}/{selectedEvent.max_participants}
                    </p>
                  </div>
                  
                  <div className="detail-item">
                    <strong style={{ color: 'var(--text-primary)' }}>⏰ Registration Deadline:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {new Date(selectedEvent.registration_deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {selectedEvent.requirements && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📋 Requirements</h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {selectedEvent.requirements}
                    </p>
                  </div>
                )}
                
                {selectedEvent.prizes && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🏆 Prizes</h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {selectedEvent.prizes}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                {isEventRegistered(selectedEvent.id) ? (
                  <button className="btn-registered" disabled style={{ width: '100%' }}>
                    ✅ Already Registered
                  </button>
                ) : (
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      setShowEventDetailsModal(false);
                      handleEventRegistration(selectedEvent.id);
                    }}
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Registering...' : 'Register for This Event'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;