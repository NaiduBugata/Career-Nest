import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/universal.css';
import '../styles/courses.css';
import CourseModal from './CourseModal';
import CreateCourseModal from './CreateCourseModal';
import EditCourseModal from './EditCourseModal';
import config from '../config';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState('overview');
  const [editCourse, setEditCourse] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) { navigate('/Role'); return; }
    if (userData) setUser(JSON.parse(userData));
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCourses(data.data || []);
    } catch (err) {
      console.error('Failed to load courses', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || c.title?.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || c.difficulty_level === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const canCreateCourses = user?.role === 'admin' || user?.role === 'organization';

  const canDeleteCourse = (course) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'organization') {
      // Allow org to delete only their own courses (best-effort check)
      const createdByMatchesName = course.created_by_name && user.username && course.created_by_name === user.username;
      const createdByMatchesId = course.created_by_id && user.id && course.created_by_id === user.id;
      return createdByMatchesName || createdByMatchesId;
    }
    return false;
  };

  const handleDeleteCourse = async (course) => {
    if (!course?.id) return;
    const confirmed = window.confirm(`Are you sure you want to delete the course "${course.title}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/courses/${course.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        const msg = data?.message || `HTTP ${res.status}`;
        alert(`Failed to delete course: ${msg}`);
        return;
      }
      // Optimistic removal without full reload for snappier UI
      setCourses(prev => prev.filter(c => c.id !== course.id));
    } catch (err) {
      console.error('Delete course error', err);
      alert(`Error deleting course: ${err.message}`);
    }
  };

  const goBack = () => {
    if (user?.role === 'organization') navigate('/Organization_Dashboard');
    else if (user?.role === 'admin') navigate('/Admin_Dashboard');
    else navigate('/Student_Dashboard');
  };

  if (loading) {
    return (
      <div className="courses-page">
        <div className="loading-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#64748B' }}>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">Career<span>Nest</span></div>
          <div className="header-right">
            <button className="btn-details" onClick={goBack} style={{ padding: '0.5rem 0.75rem' }}>← Back to Dashboard</button>
          </div>
        </div>
      </header>

      <div className="dashboard-main">
        <div className="courses-inner">
          <div className="courses-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h1 className="courses-title" style={{ margin: 0 }}>📚 Courses</h1>
            </div>
            {canCreateCourses && (
              <button className="create-course-btn" onClick={() => setShowCreateModal(true)}>➕ Create Course</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '6px', minWidth: '200px', flex: 1 }} />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '6px', background: 'white' }}>
              <option value="all">All Categories</option>
              {Array.from(new Set(courses.map(c => c.category).filter(Boolean))).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} style={{ padding: '0.75rem', border: '1px solid #D1D5DB', borderRadius: '6px', background: 'white' }}>
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📖</div>
              <h3>No courses found</h3>
              <p>{courses.length === 0 ? 'No courses have been created yet.' : 'Try adjusting your search filters.'}</p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map(course => (
                <div key={course.id} className="course-card">
                  <div className="course-thumbnail"><div className="play-icon">▶️</div></div>
                  <div className="course-content">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                    <div className="course-meta">
                      <span className="course-badge">{course.difficulty_level}</span>
                      {course.category && <span className="course-badge course-category">{course.category}</span>}
                      <span style={{ color: '#64748B', fontSize: '0.8rem' }}>By {course.created_by_name}</span>
                    </div>
                    <div className="course-actions">
                      <button className="course-btn btn-primary" onClick={() => { setModalInitialTab('overview'); setSelectedCourse(course); }}>View Details</button>
                      {canDeleteCourse(course) && (
                        <button
                          className="course-btn btn-secondary"
                          onClick={() => setEditCourse(course)}
                          title="Edit this course"
                        >
                          Edit
                        </button>
                      )}
                      {canDeleteCourse(course) && (
                        <button
                          className="course-btn btn-danger"
                          onClick={() => handleDeleteCourse(course)}
                          title="Delete this course"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCourse && (
            <CourseModal
              course={selectedCourse}
              userRole={user?.role}
              onClose={() => setSelectedCourse(null)}
              onEnrollmentChange={loadCourses}
              initialTab={modalInitialTab}
            />
          )}

          {editCourse && (
            <EditCourseModal
              isOpen={!!editCourse}
              course={editCourse}
              onClose={() => setEditCourse(null)}
              onCourseUpdated={loadCourses}
            />
          )}

          {showCreateModal && (
            <CreateCourseModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onCourseCreated={loadCourses}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;


