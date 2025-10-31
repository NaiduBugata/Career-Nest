import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/organization_dashboard.css';
import { generateBulkStudentsPDF, generateIndividualStudentPDF, generateStudentProfilePDF } from '../utils/pdfGenerator';
import CoursesEmbedded from './CoursesEmbedded';
import config from '../config';

// QuizBuilder component (outside main component to prevent re-creation on each render)
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
        <div className="no-data">No questions yet.</div>
      )}
      {questions.map((q, qi) => (
        <div key={qi} className="quiz-question-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Question {qi + 1}</label>
            <button type="button" className="btn-secondary" onClick={() => removeQuestion(qi)}>Remove</button>
          </div>
          <input
            type="text"
            value={q.question}
            onChange={(e) => updateQuestion(qi, e.target.value)}
            placeholder="Enter question"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {q.options.map((opt, oi) => (
              <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correctIndex === oi}
                  onChange={() => setCorrect(qi, oi)}
                  title="Mark correct"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  placeholder={`Option ${oi + 1}`}
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

const OrganizationDashboard = () => {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentMode, setAddStudentMode] = useState(null); // 'individual' or 'bulk'
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const toggleProfile = () => setProfileOpen(p => !p);
  const goToProfile = () => {
    setProfileOpen(false);
    navigate('/profile');
  };
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const usernameChangedFlag = () => {
    const fromUser = user?.username_changed;
    const fromLocal = localStorage.getItem('username_changed');
    return Boolean(fromUser) || fromLocal === 'true';
  };
  const navigate = useNavigate();

  // Form states
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    content: '',
    priority: 'normal'
  });

  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    type: 'hackathon',
    startDate: '',
    endDate: '',
    venue: '',
    maxParticipants: '',
    requirements: '',
    prizes: '',
    registrationDeadline: '',
    quizQuestions: [],
    problemStatementText: '',
    problemStatementLink: ''
  });

  // Auto-seed one quiz question when switching to quiz type
  useEffect(() => {
    if (eventData.type === 'quiz' && (!eventData.quizQuestions || eventData.quizQuestions.length === 0)) {
      setEventData(prev => ({
        ...prev,
        quizQuestions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }]
      }));
    }
  }, [eventData.type]);

  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    course: '',
    year: '',
    rollNumber: ''
  });

  const [bulkFile, setBulkFile] = useState(null);

  // Load pending student-created events awaiting approval
  const loadPendingEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/organization/pending-student-events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setPendingEvents(data.data || []);
      } else {
        console.error('Failed to load pending events:', data.message);
        setPendingEvents([]);
      }
    } catch (error) {
      console.error('Error loading pending events:', error);
      setPendingEvents([]);
    }
  };

  // Approve or reject a pending student event
  const handleEventApproval = async (eventId, action, feedback) => {
    if (!eventId || !['approve', 'reject'].includes(action)) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/organization/review-student-event', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventId, action, feedback })
      });

      const data = await response.json();
      if (data.success) {
        // Remove the event from pending list locally
        setPendingEvents(prev => prev.filter(e => e.id !== eventId));
        alert(`✅ Event ${action}d successfully`);
      } else {
        alert(`❌ Failed to ${action} event: ${data.message}`);
      }
    } catch (error) {
      console.error('Event approval error:', error);
      alert(`❌ Failed to ${action} event. Please check your connection.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/Role');
    }
    
    // Load initial data
    loadStudents();
    loadAnnouncements();
    loadEvents();
    loadPendingEvents();
  }, [navigate]);

  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/organization/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStudents(data.data || []);
      } else {
        console.error('Failed to load students:', data.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/organization/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data);
      } else {
        console.error('Failed to load announcements:', data.message);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      // Fallback to mock data if API fails
      const mockAnnouncements = [
        {
          id: 1,
          title: 'Welcome to New Semester',
          content: 'We are excited to start this new semester with all our students.',
          priority: 'high',
          created_at: new Date().toISOString(),
          author: 'Tech Corp HR'
        }
      ];
      setAnnouncements(mockAnnouncements);
    }
  };

  const loadEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/organization/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
      } else {
        console.error('Failed to load events:', data.message);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to mock data if API fails
      const mockEvents = [
        {
          id: 1,
          title: 'Annual Hackathon 2025',
          description: 'Join our annual hackathon and showcase your coding skills.',
          type: 'hackathon',
          start_date: '2025-11-15',
          end_date: '2025-11-17',
          venue: 'Tech Corp Campus',
          max_participants: 100,
          registeredCount: 45,
          created_at: new Date().toISOString()
        }
      ];
      setEvents(mockEvents);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/organization/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(announcementData)
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements([data.data, ...announcements]);
        setAnnouncementData({ title: '', content: '', priority: 'normal' });
        setShowAnnouncementForm(false);
        alert('✅ Announcement posted successfully!');
      } else {
        alert(`❌ Failed to post announcement: ${data.message}`);
      }
    } catch (error) {
      console.error('Announcement submission error:', error);
      alert('❌ Failed to post announcement. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build requirements payload based on event type
      let requirementsPayload = eventData.requirements || '';
      if (eventData.type === 'quiz') {
        // Expect eventData.quizQuestions from UI; coerce to JSON
        if (Array.isArray(eventData.quizQuestions) && eventData.quizQuestions.length > 0) {
          requirementsPayload = JSON.stringify({ kind: 'quiz', questions: eventData.quizQuestions });
        } else {
          alert('❌ Please add at least one quiz question');
          setLoading(false);
          return;
        }
      } else if (eventData.type === 'hackathon') {
        // Expect problem statement text or link
        const psText = (eventData.problemStatementText || '').trim();
        const psLink = (eventData.problemStatementLink || '').trim();
        if (!psText && !psLink) {
          alert('❌ Please provide a problem statement text or a link');
          setLoading(false);
          return;
        }
        requirementsPayload = JSON.stringify({ kind: 'hackathon', problemStatementText: psText || undefined, problemStatementLink: psLink || undefined });
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/organization/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          venue: eventData.venue,
          maxParticipants: parseInt(eventData.maxParticipants),
          requirements: requirementsPayload,
          prizes: eventData.prizes,
          registrationDeadline: eventData.registrationDeadline
        })
      });

      const data = await response.json();

      if (data.success) {
        setEvents([data.data, ...events]);
        setEventData({
          title: '',
          description: '',
          type: 'hackathon',
          startDate: '',
          endDate: '',
          venue: '',
          maxParticipants: '',
          requirements: '',
          prizes: '',
          registrationDeadline: '',
          quizQuestions: [],
          problemStatementText: '',
          problemStatementLink: ''
        });
        setShowEventForm(false);
        alert('✅ Event created successfully!');
      } else {
        alert(`❌ Failed to create event: ${data.message}`);
      }
    } catch (error) {
      console.error('Event submission error:', error);
      alert('❌ Failed to create event. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleAddStudentIndividual = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !currentUser || currentUser.role !== 'organization') {
        setLoading(false);
        alert('❌ You must be logged in as an organization to add students. Please log in and try again.');
        navigate('/');
        return;
      }
      
      // Log request data for debugging
      console.log('Sending student data:', studentData);
      
      const response = await fetch(`${config.API_URL}/organization/add-student', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (response.status === 401) {
        alert(`❌ ${data.message || 'Session expired. Please log in again.'}`);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      if (data.success) {
        // Generate PDF with credentials
        const pdfData = {
          ...studentData,
          password: data.data.temporaryPassword
        };
        generateIndividualStudentPDF(pdfData, user?.username || 'Organization');
        
        alert(`✅ Student added successfully!\n\n📄 PDF Downloaded with credentials:\nEmail: ${data.data.email}\nPassword: ${data.data.temporaryPassword}\n\nPlease check your downloads folder.`);
        setStudentData({ name: '', email: '', course: '', year: '', rollNumber: '' });
        setShowAddStudentModal(false);
        setAddStudentMode(null);
        loadStudents();
      } else {
        // If email already exists, prompt to link existing student
        const msg = (data.message || '').toLowerCase();
        if (msg.includes('already exists')) {
          const confirmLink = window.confirm('This email already exists. Do you want to link this existing student to your organization?');
          if (confirmLink) {
            const linkResp = await fetch(`${config.API_URL}/organization/link-existing-student-by-email', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: studentData.email,
                rollNumber: studentData.rollNumber,
                course: studentData.course,
                year: studentData.year
              })
            });
            const linkData = await linkResp.json();
            if (linkResp.ok && linkData.success) {
              alert('✅ Existing student linked to your organization successfully.');
              setStudentData({ name: '', email: '', course: '', year: '', rollNumber: '' });
              setShowAddStudentModal(false);
              setAddStudentMode(null);
              loadStudents();
              return;
            } else {
              alert(`❌ Failed to link student: ${linkData.message || 'Unknown error'}`);
            }
          }
        } else {
          alert(`❌ Failed to add student: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Add student error:', error);
      alert(`❌ Failed to add student. ${error.message?.includes('Failed to fetch') ? 'Cannot reach server.' : 'Please check your session.'}\n\nTip: Ensure you are logged in as an organization.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudentBulk = async (e) => {
    e.preventDefault();
    
    if (!bulkFile) {
      alert('❌ Please select a file to upload');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !currentUser || currentUser.role !== 'organization') {
        setLoading(false);
        alert('❌ You must be logged in as an organization to add students. Please log in and try again.');
        navigate('/');
        return;
      }
      const formData = new FormData();
      formData.append('file', bulkFile);

      console.log('Uploading file:', bulkFile.name);

      const response = await fetch(`${config.API_URL}/organization/add-students-bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Bulk upload response:', data);

      if (response.status === 401) {
        alert(`❌ ${data.message || 'Session expired. Please log in again.'}`);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      if (data.success) {
        // Generate PDF with all student credentials
        if (data.credentials && data.credentials.length > 0) {
          generateBulkStudentsPDF(data.credentials, user?.username || 'Organization');
        }
        
        let message = `✅ ${data.successCount} students added successfully!\n\n📄 PDF Downloaded with all credentials.\nPlease check your downloads folder.`;
        
        if (data.errors && data.errors.length > 0) {
          message += `\n\n⚠️ ${data.errors.length} students failed to add:\n`;
          data.errors.forEach(err => {
            message += `- Row ${err.row}: ${err.error}\n`;
          });
        }
        alert(message);
        setBulkFile(null);
        setShowAddStudentModal(false);
        setAddStudentMode(null);
        loadStudents();
      } else {
        alert(`❌ Failed to add students: ${data.message}`);
      }
    } catch (error) {
      console.error('Bulk add students error:', error);
      alert('❌ Failed to add students. Check your connection or login session.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (student) => {
    // Generate password from roll number (same pattern used during creation)
    const generatedPassword = `${student.roll_number}@CN`;
    const fullStudentData = {
      ...student,
      password: generatedPassword
    };
    setSelectedStudent(fullStudentData);
    setShowStudentProfile(true);
  };

  const handleDownloadProfilePDF = () => {
    if (selectedStudent) {
      generateStudentProfilePDF(selectedStudent, user?.username || 'Organization');
    }
  };

  const handleDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !currentUser || currentUser.role !== 'organization') {
        setLoading(false);
        alert('❌ You must be logged in as an organization to delete students.');
        navigate('/');
        return;
      }
      const response = await fetch(`${config.API_URL}/organization/delete-student/${studentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        alert(`❌ ${data.message || 'Session expired. Please log in again.'}`);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      if (data.success) {
        alert(`✅ Student "${studentToDelete.name}" has been deleted successfully.`);
        setShowDeleteConfirm(false);
        setStudentToDelete(null);
        loadStudents(); // Reload the student list
      } else {
        alert(`❌ Failed to delete student: ${data.message}`);
      }
    } catch (error) {
      console.error('Delete student error:', error);
      alert('❌ Failed to delete student. Check your connection or login session.');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setStudentToDelete(null);
  };

  const handleDeleteAllStudents = () => {
    if (students.length === 0) {
      alert('❌ No students to delete.');
      return;
    }
    setShowDeleteAllConfirm(true);
    setDeleteAllConfirmText('');
  };

  const confirmDeleteAllStudents = async () => {
    // Require exact text confirmation
    if (deleteAllConfirmText !== 'DELETE ALL') {
      alert('❌ Please type "DELETE ALL" to confirm this action.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !currentUser || currentUser.role !== 'organization') {
        setLoading(false);
        alert('❌ You must be logged in as an organization to delete students.');
        navigate('/');
        return;
      }
      const response = await fetch(`${config.API_URL}/organization/delete-all-students', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        alert(`❌ ${data.message || 'Session expired. Please log in again.'}`);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      if (data.success) {
        alert(`✅ Successfully deleted ${data.deletedCount} student(s) from your organization.`);
        setShowDeleteAllConfirm(false);
        setDeleteAllConfirmText('');
        loadStudents(); // Reload the student list
      } else {
        alert(`❌ Failed to delete students: ${data.message}`);
      }
    } catch (error) {
      console.error('Delete all students error:', error);
      alert('❌ Failed to delete students. Check your connection or login session.');
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteAll = () => {
    setShowDeleteAllConfirm(false);
    setDeleteAllConfirmText('');
  };

  return (
    <div className="org-dashboard">
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
                <div className="avatar">{(user?.name || user?.username || 'U')[0]?.toUpperCase?.() || 'U'}</div>
              </button>
              <div className={`profile-backdrop ${profileOpen ? 'open' : ''}`} onClick={() => setProfileOpen(false)} />
              <aside className={`profile-drawer ${profileOpen ? 'open' : ''}`} role="dialog" aria-label="Profile drawer">
                <div className="profile-drawer-header">
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="avatar large">{(user?.name || user?.username || 'U')[0]?.toUpperCase?.() || 'U'}</div>
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
                                const updatedUser = { ...user, username: trimmed };
                                setEditingUsername(false);
                                setUser(updatedUser);
                                localStorage.setItem('user', JSON.stringify(updatedUser));
                                localStorage.setItem('username_changed', 'true');
                                try {
                                  const token = localStorage.getItem('token');
                                  const resp = await fetch(`${config.API_URL}/auth/profile', {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ username: trimmed })
                                  });
                                  if (!resp.ok) {
                                    const err = await resp.json().catch(() => ({}));
                                    alert(err.message || 'Failed to update username on server; change saved locally.');
                                  }
                                } catch (err) {
                                  console.warn('Profile update failed (backend):', err?.message || err);
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
                    <button className="btn-primary" style={{ width: '100%' }} onClick={goToProfile}>Edit Profile</button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="dashboard-nav-wrapper">
      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Students
        </button>
        <button 
          className={`nav-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          📢 Announcements
        </button>
        <button 
          className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          🎉 Events
        </button>
        <button 
          className={`nav-tab ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          ✅ Pending Approvals {pendingEvents.length > 0 && <span className="badge">{pendingEvents.length}</span>}
        </button>
        <button 
          className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses
        </button>
      </nav>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <h2>Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{students.length}</div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{announcements.length}</div>
                <div className="stat-label">Announcements</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{events.length}</div>
                <div className="stat-label">Active Events</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {events.reduce((sum, event) => sum + event.registeredCount, 0)}
                </div>
                <div className="stat-label">Event Registrations</div>
              </div>
            </div>

            <div className="recent-activities">
              <h3>Recent Activities</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-icon">📢</span>
                  <span>Latest announcement posted</span>
                  <span className="activity-time">2 hours ago</span>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">🎉</span>
                  <span>New event created</span>
                  <span className="activity-time">1 day ago</span>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">👥</span>
                  <span>5 new student registrations</span>
                  <span className="activity-time">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="students-content">
            <div className="section-header">
              <h2>Students in Your Organization</h2>
              <div className="section-actions">
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  className="btn-danger-outline"
                  onClick={handleDeleteAllStudents}
                  disabled={students.length === 0}
                  title="Delete all students from your organization"
                >
                  🗑️ Delete All
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowAddStudentModal(true);
                  }}
                >
                  + Add Students
                </button>
              </div>
            </div>
            
            <div className="students-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Roll No.</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = students.filter(student => {
                      const query = (searchQuery || '').toLowerCase().trim();
                      if (!query) return true;
                      return (
                        student.name?.toLowerCase().includes(query) ||
                        student.email?.toLowerCase().includes(query) ||
                        student.course?.toLowerCase().includes(query) ||
                        student.year?.toLowerCase().includes(query) ||
                        student.roll_number?.toLowerCase().includes(query)
                      );
                    });
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>
                            No students found{searchQuery ? ` for "${searchQuery}"` : ''}.
                          </td>
                        </tr>
                      );
                    }
                    return filtered.map(student => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                        <td>{student.roll_number || 'N/A'}</td>
                        <td>{student.course}</td>
                        <td>{student.year}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-small btn-view" 
                              onClick={() => handleViewProfile(student)}
                              title="View student profile"
                            >
                              👁️ View
                            </button>
                            <button 
                              className="btn-small btn-delete" 
                              onClick={() => handleDeleteStudent(student)}
                              title="Delete student"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="announcements-content">
            <div className="section-header">
              <h2>Announcements</h2>
              <button 
                className="btn-primary"
                onClick={() => {
                  setProfileOpen(false);
                  setShowAnnouncementForm(true);
                }}
              >
                + New Announcement
              </button>
            </div>

            <div className="announcements-list">
              {(announcements || []).map(announcement => (
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
              ))}
            </div>

            {/* Announcement Form Modal */}
            {showAnnouncementForm && (
              <div className="modal-overlay">
                <div className="modal">
                  <div className="modal-header">
                    <h3>Create New Announcement</h3>
                    <button 
                      className="close-btn"
                      onClick={() => setShowAnnouncementForm(false)}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleAnnouncementSubmit}>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={announcementData.title}
                        onChange={(e) => setAnnouncementData({
                          ...announcementData,
                          title: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Content</label>
                      <textarea
                        value={announcementData.content}
                        onChange={(e) => setAnnouncementData({
                          ...announcementData,
                          content: e.target.value
                        })}
                        rows="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={announcementData.priority}
                        onChange={(e) => setAnnouncementData({
                          ...announcementData,
                          priority: e.target.value
                        })}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setShowAnnouncementForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Posting...' : 'Post Announcement'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="events-content">
            <div className="section-header">
              <h2>Events</h2>
              <button 
                className="btn-primary"
                onClick={() => {
                  setProfileOpen(false);
                  setShowEventForm(true);
                }}
              >
                + Create Event
              </button>
            </div>

            <div className="events-grid">
              {(events || []).map(event => (
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
                      <strong>Registrations:</strong> {event.registeredCount}/{event.max_participants}
                    </div>
                  </div>
                  <div className="event-actions">
                    <button className="btn-small">View Details</button>
                    <button className="btn-small">Edit</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Event Form Modal */}
            {showEventForm && (
              <div className="modal-overlay">
                <div className="modal large">
                  <div className="modal-header">
                    <h3>Create New Event</h3>
                    <button 
                      className="close-btn"
                      onClick={() => setShowEventForm(false)}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleEventSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Event Title</label>
                        <input
                          type="text"
                          value={eventData.title}
                          onChange={(e) => setEventData(prev => ({
                            ...prev,
                            title: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Event Type</label>
                        <select
                          value={eventData.type}
                          onChange={(e) => setEventData(prev => ({
                            ...prev,
                            type: e.target.value
                          }))}
                        >
                          <option value="hackathon">Hackathon</option>
                          <option value="quiz">Quiz Competition</option>
                          <option value="coding">Coding Competition</option>
                          <option value="workshop">Workshop</option>
                          <option value="seminar">Seminar</option>
                          <option value="conference">Conference</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={eventData.description}
                        onChange={(e) => setEventData(prev => ({
                          ...prev,
                          description: e.target.value
                        }))}
                        rows="3"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Start Date</label>
                        <input
                          type="date"
                          value={eventData.startDate}
                          onChange={(e) => setEventData(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>End Date</label>
                        <input
                          type="date"
                          value={eventData.endDate}
                          onChange={(e) => setEventData(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Venue</label>
                        <input
                          type="text"
                          value={eventData.venue}
                          onChange={(e) => setEventData(prev => ({
                            ...prev,
                            venue: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Max Participants</label>
                        <input
                          type="number"
                          value={eventData.maxParticipants}
                          onChange={(e) => setEventData(prev => ({
                            ...prev,
                            maxParticipants: e.target.value
                          }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Registration Deadline</label>
                      <input
                        type="date"
                        value={eventData.registrationDeadline}
                        onChange={(e) => setEventData(prev => ({
                          ...prev,
                          registrationDeadline: e.target.value
                        }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Requirements</label>
                      <textarea
                        value={eventData.requirements}
                        onChange={(e) => setEventData(prev => ({
                          ...prev,
                          requirements: e.target.value
                        }))}
                        rows="3"
                        placeholder="Any specific requirements or prerequisites..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Prizes</label>
                      <textarea
                        value={eventData.prizes}
                        onChange={(e) => setEventData(prev => ({
                          ...prev,
                          prizes: e.target.value
                        }))}
                        rows="2"
                        placeholder="Prize details..."
                      />
                    </div>

                    {/* Conditional inputs based on type */}
                    {eventData.type === 'quiz' && (
                      <div className="form-group" style={{ marginTop: '0.5rem' }}>
                        <label>Quiz Questions</label>
                        <QuizBuilder
                          questions={eventData.quizQuestions || []}
                          onChange={(qs) => setEventData(prev => ({ ...prev, quizQuestions: qs }))}
                        />
                      </div>
                    )}

                    {eventData.type === 'hackathon' && (
                      <div className="form-group" style={{ marginTop: '0.5rem' }}>
                        <label>Problem Statement</label>
                        <textarea
                          value={eventData.problemStatementText || ''}
                          onChange={(e) => setEventData(prev => ({ ...prev, problemStatementText: e.target.value }))}
                          rows="4"
                          placeholder="Paste problem statement here..."
                        />
                        <div style={{ marginTop: '0.5rem' }}>
                          <label>Or provide a link</label>
                          <input
                            type="url"
                            value={eventData.problemStatementLink || ''}
                            onChange={(e) => setEventData(prev => ({ ...prev, problemStatementLink: e.target.value }))}
                            placeholder="https://example.com/problem-statement.pdf"
                          />
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                          Tip: We will soon support direct file uploads. For now, use text or a link.
                        </p>
                      </div>
                    )}

                    <div className="modal-actions">
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setShowEventForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Creating...' : 'Create Event'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab (embedded) */}
        {activeTab === 'courses' && (
          <div className="courses-embedded">
            <CoursesEmbedded user={user} />
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="approvals-content">
            <div className="section-header">
              <h2>Pending Student Events</h2>
              <span className="pending-count">
                {pendingEvents.length} event{pendingEvents.length !== 1 ? 's' : ''} awaiting approval
              </span>
            </div>

            {pendingEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Pending Events</h3>
                <p>All student-created public events have been reviewed.</p>
              </div>
            ) : (
              <div className="pending-events-grid">
                {(pendingEvents || []).map(event => (
                  <div key={event.id} className="pending-event-card">
                    <div className="event-header">
                      <h3>{event.title}</h3>
                      <div className="event-meta">
                        <span className="event-type">{event.type}</span>
                        <span className="created-by">by {event.student_name}</span>
                      </div>
                    </div>
                    
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-details">
                      <div className="detail-row">
                        <strong>📅 Date:</strong> 
                        {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                      </div>
                      <div className="detail-row">
                        <strong>📍 Venue:</strong> {event.venue}
                      </div>
                      <div className="detail-row">
                        <strong>👥 Max Participants:</strong> {event.max_participants}
                      </div>
                      <div className="detail-row">
                        <strong>📞 Student Contact:</strong> {event.student_email}
                      </div>
                      {event.requirements && (
                        <div className="detail-row">
                          <strong>📋 Requirements:</strong> {event.requirements}
                        </div>
                      )}
                      {event.prizes && (
                        <div className="detail-row">
                          <strong>🏆 Prizes:</strong> {event.prizes}
                        </div>
                      )}
                      <div className="detail-row">
                        <strong>⏰ Registration Deadline:</strong> 
                        {new Date(event.registration_deadline).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="approval-actions">
                      <button 
                        className="btn-approve"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to approve "${event.title}"?`)) {
                            handleEventApproval(event.id, 'approve');
                          }
                        }}
                        disabled={loading}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => {
                          const feedback = window.prompt(`Reason for rejecting "${event.title}":`);
                          if (feedback !== null) {
                            handleEventApproval(event.id, 'reject', feedback);
                          }
                        }}
                        disabled={loading}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Students Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Students</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddStudentModal(false);
                  setAddStudentMode(null);
                  setBulkFile(null);
                  setStudentData({ name: '', email: '', course: '', year: '', rollNumber: '' });
                }}
              >
                ×
              </button>
            </div>

            {!addStudentMode ? (
              <div className="mode-selection">
                <h4>Choose how to add students:</h4>
                <div className="mode-buttons">
                  <button 
                    className="mode-btn"
                    onClick={() => setAddStudentMode('individual')}
                  >
                    <span className="mode-icon">👤</span>
                    <span className="mode-title">Individual</span>
                    <span className="mode-desc">Add one student at a time</span>
                  </button>
                  <button 
                    className="mode-btn"
                    onClick={() => setAddStudentMode('bulk')}
                  >
                    <span className="mode-icon">📊</span>
                    <span className="mode-title">Bulk Upload</span>
                    <span className="mode-desc">Upload CSV or Excel file</span>
                  </button>
                </div>
              </div>
            ) : addStudentMode === 'individual' ? (
              <form onSubmit={handleAddStudentIndividual}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={studentData.name}
                    onChange={(e) => setStudentData({
                      ...studentData,
                      name: e.target.value
                    })}
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={studentData.email}
                    onChange={(e) => setStudentData({
                      ...studentData,
                      email: e.target.value
                    })}
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Roll Number *</label>
                  <input
                    type="text"
                    value={studentData.rollNumber}
                    onChange={(e) => setStudentData({
                      ...studentData,
                      rollNumber: e.target.value
                    })}
                    placeholder="Enter roll number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Course *</label>
                  <input
                    type="text"
                    value={studentData.course}
                    onChange={(e) => setStudentData({
                      ...studentData,
                      course: e.target.value
                    })}
                    placeholder="e.g., Computer Science, MBA"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Year *</label>
                  <select
                    value={studentData.year}
                    onChange={(e) => setStudentData({
                      ...studentData,
                      year: e.target.value
                    })}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setAddStudentMode(null)}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddStudentBulk}>
                <div className="bulk-upload-info">
                  <h4>📋 Upload Instructions:</h4>
                  <ul>
                    <li>Upload a CSV or Excel file (.csv, .xlsx)</li>
                    <li>Required columns: Name, Email, Roll Number, Course, Year</li>
                    <li>Download sample template: <a href="#" onClick={(e) => { e.preventDefault(); downloadSampleTemplate(); }}>sample_students.csv</a></li>
                  </ul>
                </div>

                <div className="form-group">
                  <label>Select File *</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setBulkFile(e.target.files[0])}
                    required
                  />
                  {bulkFile && (
                    <div className="file-info">
                      📎 Selected: {bulkFile.name}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setAddStudentMode(null);
                      setBulkFile(null);
                    }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Uploading...' : 'Upload & Add Students'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {showStudentProfile && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content profile-modal">
            <div className="modal-header">
              <h2>Student Profile</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowStudentProfile(false)}
              >
                ×
              </button>
            </div>

            <div className="profile-content">
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Name:</label>
                    <span>{selectedStudent.name}</span>
                  </div>
                  <div className="profile-item">
                    <label>Email:</label>
                    <span>{selectedStudent.email}</span>
                  </div>
                  <div className="profile-item">
                    <label>Username:</label>
                    <span>{selectedStudent.username}</span>
                  </div>
                  <div className="profile-item">
                    <label>Roll Number:</label>
                    <span>{selectedStudent.roll_number}</span>
                  </div>
                  <div className="profile-item">
                    <label>Course:</label>
                    <span>{selectedStudent.course}</span>
                  </div>
                  <div className="profile-item">
                    <label>Year:</label>
                    <span>{selectedStudent.year}</span>
                  </div>
                  <div className="profile-item">
                    <label>Organization:</label>
                    <span>{user?.username}</span>
                  </div>
                  <div className="profile-item">
                    <label>Joined Date:</label>
                    <span>{new Date(selectedStudent.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="profile-section credentials-section">
                <h3>🔐 Login Credentials</h3>
                <div className="credentials-box">
                  <div className="credential-item">
                    <label>Email:</label>
                    <span className="credential-value">{selectedStudent.email}</span>
                  </div>
                  <div className="credential-item">
                    <label>Password:</label>
                    <span className="credential-value password-value">{selectedStudent.password}</span>
                  </div>
                  <p className="credential-warning">
                    ⚠️ Keep these credentials confidential
                  </p>
                </div>
              </div>

              <div className="profile-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowStudentProfile(false)}
                >
                  Close
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleDownloadProfilePDF}
                >
                  📄 Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && studentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>⚠️ Confirm Delete</h2>
              <button 
                className="close-btn" 
                onClick={cancelDelete}
              >
                ×
              </button>
            </div>

            <div className="delete-content">
              <div className="warning-icon">🗑️</div>
              <p className="delete-message">
                Are you sure you want to delete this student?
              </p>
              <div className="student-details">
                <p><strong>Name:</strong> {studentToDelete.name}</p>
                <p><strong>Email:</strong> {studentToDelete.email}</p>
                <p><strong>Roll Number:</strong> {studentToDelete.roll_number}</p>
                <p><strong>Course:</strong> {studentToDelete.course}</p>
              </div>
              <p className="delete-warning">
                ⚠️ This action cannot be undone. The student will be permanently removed from your organization.
              </p>
            </div>

            <div className="delete-actions">
              <button 
                className="btn-secondary"
                onClick={cancelDelete}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-danger"
                onClick={confirmDeleteStudent}
                disabled={loading}
              >
                {loading ? 'Deleting...' : '🗑️ Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Students Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-all-modal">
            <div className="modal-header">
              <h2>⚠️ DELETE ALL STUDENTS</h2>
              <button 
                className="close-btn" 
                onClick={cancelDeleteAll}
              >
                ×
              </button>
            </div>

            <div className="delete-all-content">
              <div className="warning-icon-large">⚠️🗑️⚠️</div>
              <p className="delete-all-title">
                CRITICAL WARNING: This will permanently delete ALL students!
              </p>
              
              <div className="danger-box">
                <h3>⛔ What will be deleted:</h3>
                <ul>
                  <li>✗ All {students.length} student(s) from your organization</li>
                  <li>✗ All student user accounts</li>
                  <li>✗ All student login credentials</li>
                  <li>✗ All student data (emails, roll numbers, courses)</li>
                </ul>
              </div>

              <div className="consequences-box">
                <h3>🚨 Consequences:</h3>
                <ul>
                  <li>❌ Students will no longer be able to login</li>
                  <li>❌ All student information will be lost forever</li>
                  <li>❌ This action CANNOT be undone</li>
                  <li>❌ No backup will be created</li>
                </ul>
              </div>

              <div className="confirmation-input-section">
                <p className="confirmation-instruction">
                  To confirm this IRREVERSIBLE action, type <strong className="confirm-text">"DELETE ALL"</strong> below:
                </p>
                <input
                  type="text"
                  className="confirmation-input"
                  placeholder='Type "DELETE ALL" here'
                  value={deleteAllConfirmText}
                  onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                  disabled={loading}
                />
                <p className="input-hint">
                  {deleteAllConfirmText === 'DELETE ALL' ? '✅ Confirmed' : '⚠️ Type exactly: DELETE ALL'}
                </p>
              </div>

              <p className="final-warning">
                ⚠️ FINAL WARNING: Once deleted, there is NO WAY to recover this data!
              </p>
            </div>

            <div className="delete-all-actions">
              <button 
                className="btn-secondary"
                onClick={cancelDeleteAll}
                disabled={loading}
              >
                Cancel (Keep Students)
              </button>
              <button 
                className="btn-danger-strong"
                onClick={confirmDeleteAllStudents}
                disabled={loading || deleteAllConfirmText !== 'DELETE ALL'}
              >
                {loading ? 'Deleting All Students...' : '🗑️ DELETE ALL STUDENTS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to download sample CSV template
const downloadSampleTemplate = () => {
  const csvContent = "Name,Email,Roll Number,Course,Year\nJohn Doe,john@example.com,CS001,Computer Science,2nd Year\nJane Smith,jane@example.com,CS002,Computer Science,3rd Year";
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample_students.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

export default OrganizationDashboard;


