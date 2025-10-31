import React, { useEffect, useState } from 'react';
import config from '../config';

const EditCourseModal = ({ isOpen, onClose, course, onCourseUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    difficulty_level: 'Beginner',
    category: '',
    tags: '',
    transcriptSummary: ''
  });
  const [quizQuestions, setQuizQuestions] = useState([]);

  useEffect(() => {
    if (!isOpen || !course?.id) return;
    const loadDetails = async () => {
      try {
        setInitializing(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${config.API_URL}/courses/${course.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const c = data.data || {};
        setFormData({
          title: c.title || '',
          description: c.description || '',
          youtube_url: c.youtube_url || '',
          difficulty_level: c.difficulty_level || 'Beginner',
          category: c.category || '',
          tags: Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || ''),
          transcriptSummary: c.transcript_summary || ''
        });
        const q = Array.isArray(c.quiz_questions) ? c.quiz_questions.map((q, idx) => ({
          // preserve server id if exists to allow mapping
          id: q.id || idx + 1,
          questionText: q.question_text || '',
          questionType: q.question_type || 'multiple_choice',
          options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['', '', '', ''],
          correctAnswer: q.correct_answer || '',
          points: q.points || 1
        })) : [];
        setQuizQuestions(q);
      } catch (err) {
        console.error('Failed to load course details for edit', err);
        // Fallback to using the list item fields
        setFormData(prev => ({
          ...prev,
          title: course.title || prev.title,
          description: course.description || prev.description,
          difficulty_level: course.difficulty_level || prev.difficulty_level,
          category: course.category || prev.category
        }));
      } finally {
        setInitializing(false);
      }
    };
    loadDetails();
  }, [isOpen, course?.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addQuizQuestion = () => {
    setQuizQuestions(prev => ([
      ...prev,
      { id: Date.now(), questionText: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }
    ]));
  };

  const updateQuizQuestion = (questionId, field, value) => {
    setQuizQuestions(prev => prev.map(q => q.id === questionId ? { ...q, [field]: value } : q));
  };

  const updateQuestionOption = (questionId, optionIndex, value) => {
    setQuizQuestions(prev => prev.map(q => q.id === questionId ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) } : q));
  };

  const removeQuizQuestion = (questionId) => {
    setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!course?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        title: formData.title,
        description: formData.description,
        youtube_url: formData.youtube_url,
        difficulty_level: formData.difficulty_level,
        category: formData.category || '',
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        transcript_summary: formData.transcriptSummary || '',
        quiz_questions: quizQuestions.map(q => ({
          question_id: q.id,
          question_text: q.questionText,
          question_type: q.questionType,
          options: (q.options || []).filter(opt => (opt || '').trim()),
          correct_answer: q.correctAnswer,
          points: parseInt(q.points) || 1
        })).filter(q => q.question_text && q.correct_answer)
      };
      const res = await fetch(`${config.API_URL}/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        const msg = data?.message || `HTTP ${res.status}`;
        alert(`Failed to update course: ${msg}`);
        return;
      }
      alert('✅ Course updated successfully');
      onCourseUpdated && onCourseUpdated();
      onClose && onClose();
    } catch (err) {
      console.error('Update course error', err);
      alert(`❌ Error updating course: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="course-modal">
      <div className="course-modal-content" style={{ maxWidth: '900px' }}>
        <div className="course-modal-header">
          <button className="close-modal-btn" onClick={onClose}>×</button>
          <h2>Edit Course</h2>
          <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>
            Update course content, video, and quiz
          </p>
        </div>

        <div className="course-modal-body">
          {initializing ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="loading-spinner" />
              <p style={{ marginTop: '0.75rem', color: '#64748B' }}>Loading course...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="course-form">
              {/* Basic Course Information */}
              <div className="form-section">
                <h3>📚 Course Information</h3>
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-input form-textarea" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">YouTube URL *</label>
                    <input type="url" name="youtube_url" value={formData.youtube_url} onChange={handleInputChange} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty Level</label>
                    <select name="difficulty_level" value={formData.difficulty_level} onChange={handleInputChange} className="form-select">
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Transcript Summary</label>
                  <textarea name="transcriptSummary" value={formData.transcriptSummary} onChange={handleInputChange} className="form-input form-textarea" rows="4" />
                </div>
              </div>

              {/* Quiz Section */}
              <div className="form-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>🧠 Quiz Questions</h3>
                  <button type="button" onClick={addQuizQuestion} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>+ Add Question</button>
                </div>
                {quizQuestions.map((question, index) => (
                  <div key={question.id} className="quiz-question-form">
                    <div className="question-header">
                      <h4>Question {index + 1}</h4>
                      <button type="button" onClick={() => removeQuizQuestion(question.id)} className="btn-danger-small">Remove</button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Question Text *</label>
                      <textarea value={question.questionText} onChange={(e) => updateQuizQuestion(question.id, 'questionText', e.target.value)} className="form-input" rows="2" required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Question Type</label>
                        <select value={question.questionType} onChange={(e) => updateQuizQuestion(question.id, 'questionType', e.target.value)} className="form-select">
                          <option value="multiple_choice">Multiple Choice</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Points</label>
                        <input type="number" value={question.points} onChange={(e) => updateQuizQuestion(question.id, 'points', e.target.value)} className="form-input" min="1" max="10" />
                      </div>
                    </div>
                    {question.questionType === 'multiple_choice' && (
                      <div className="form-group">
                        <label className="form-label">Answer Options</label>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input type="text" value={option} onChange={(e) => updateQuestionOption(question.id, optIndex, e.target.value)} className="form-input" placeholder={`Option ${optIndex + 1}`} style={{ flex: 1 }} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input type="radio" name={`correct-${question.id}`} checked={question.correctAnswer === option} onChange={() => updateQuizQuestion(question.id, 'correctAnswer', option)} />
                              Correct
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Actions */}
              <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving Changes...' : '💾 Save Changes'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditCourseModal;

