import React, { useState, useEffect, useRef } from 'react';
import config from '../config';

const CourseModal = ({ course, userRole, onClose, onEnrollmentChange, initialTab = 'overview' }) => {
  console.log('🎬 CourseModal rendered with props:', { course, userRole });
  
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [quizTimer, setQuizTimer] = useState(0);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const autoEnrollAttempted = useRef(false);
  const [videoCompleted, setVideoCompleted] = useState(false);

  useEffect(() => {
    console.log('⚡ CourseModal useEffect triggered for course ID:', course.id);
    loadCourseDetails();
  }, [course.id]);

  // After details load, honor initialTab if valid
  useEffect(() => {
    if (!courseDetails) return;
    const hasQuizLocal = courseDetails.quiz_questions && courseDetails.quiz_questions.length > 0;
    if (initialTab === 'quiz' && hasQuizLocal) {
      setActiveTab('quiz');
    } else if (initialTab === 'video') {
      setActiveTab('video');
    } else {
      // keep current or default to overview
      setActiveTab(prev => prev || 'overview');
    }
    // run once per details change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseDetails]);

  useEffect(() => {
    let interval;
    if (activeTab === 'quiz' && !quizResults) {
      interval = setInterval(() => {
        setQuizTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab, quizResults]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 Loading course details for course ID:', course.id);
      console.log('🔑 Auth token exists:', !!token);
      console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const url = `${config.API_URL}/courses/${course.id}`;
      console.log('📡 Request URL:', url);
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      console.log('📡 Request headers:', headers);
      
      const response = await fetch(url, { headers });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response status text:', response.statusText);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        console.log('✅ Course details loaded successfully');
        setCourseDetails(data.data);
        // Auto-enroll only once per modal open if not enrolled
        if (userRole === 'student' && !data.data.is_enrolled && !autoEnrollAttempted.current) {
          autoEnrollAttempted.current = true;
          await enrollInCourse();
        }
      } else {
        console.error('❌ API returned success=false:', data.message);
        alert(`Failed to load course details: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Fetch error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert(`Network error: Cannot connect to server. Please check if the backend is running.`);
      } else {
        alert(`Error loading course details: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async () => {
    try {
      console.log('🎯 Starting enrollment for course:', course.id);
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Enrollment response status:', response.status);
      const data = await response.json();
      console.log('📦 Enrollment response data:', data);
      
      if (data.success) {
        console.log('✅ Enrollment successful, calling onEnrollmentChange');
        onEnrollmentChange();
        // Update local state to reflect enrollment without refetch loop
        setCourseDetails(prev => prev ? { ...prev, is_enrolled: true } : prev);
      } else {
        console.error('❌ Enrollment failed:', data.message);
        alert(`Failed to enroll: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Error enrolling in course:', error);
      alert(`Error enrolling in course: ${error.message}`);
    }
  };

  const updateVideoProgress = async (percentage) => {
    if (userRole !== 'student') return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${config.API_URL}/courses/${course.id}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          watchPercentage: percentage,
          watched: percentage >= 90
        })
      });
      if (percentage >= 90) {
        setVideoCompleted(true);
      }
    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  const handleStartQuiz = () => {
    // Switch to quiz tab and reset any previous quiz state
    setQuizResults(null);
    setQuizAnswers({});
    setQuizTimer(0);
    setActiveTab('quiz');
  };

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitQuiz = async () => {
    if (isSubmittingQuiz) return;
    
    try {
      setIsSubmittingQuiz(true);
      const token = localStorage.getItem('token');
      
      const answersArray = courseDetails.quiz_questions.map(q => ({
        question_id: q.id,
        answer: quizAnswers[q.id] || ''
      }));

      const response = await fetch(`${config.API_URL}/courses/${course.id}/quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: answersArray,
          timeTakenSeconds: quizTimer
        })
      });

      const data = await response.json();
      if (data.success) {
        setQuizResults(data.data);
        onEnrollmentChange(); // Refresh progress
      } else {
        alert('Failed to submit quiz: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) {
      // Try both possible field names from backend
      url = courseDetails?.videoUrl || courseDetails?.youtube_url;
    }
    if (!url) return '';
    
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&modestbranding=1&rel=0`;
      }
    }
    
    // If already an embed URL, return as-is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    return '';
  };

  if (loading) {
    return (
      <div className="course-modal">
        <div className="course-modal-content">
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem' }}>Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!courseDetails) {
    return (
      <div className="course-modal">
        <div className="course-modal-content">
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p>Failed to load course details.</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const hasQuiz = courseDetails.quiz_questions && courseDetails.quiz_questions.length > 0;
  const allQuestionsAnswered = hasQuiz && courseDetails.quiz_questions.every(q => quizAnswers[q.id]);

  return (
    <div className="course-modal">
      <div className="course-modal-content">
        {/* Header */}
        <div className="course-modal-header">
          <button className="close-modal-btn" onClick={onClose}>×</button>
          <h2>{courseDetails.title}</h2>
          <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>
            {courseDetails.difficulty_level} • By {courseDetails.created_by_name}
            {courseDetails.category && ` • ${courseDetails.category}`}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ 
            display: 'flex', 
            padding: '0 2rem',
            gap: '2rem'
          }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '1rem 0',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'overview' ? '3px solid #4A90E2' : '3px solid transparent',
                color: activeTab === 'overview' ? '#4A90E2' : '#64748B',
                fontWeight: activeTab === 'overview' ? '600' : 'normal',
                cursor: 'pointer'
              }}
            >
              📖 Overview
            </button>
            <button
              onClick={() => setActiveTab('video')}
              style={{
                padding: '1rem 0',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'video' ? '3px solid #4A90E2' : '3px solid transparent',
                color: activeTab === 'video' ? '#4A90E2' : '#64748B',
                fontWeight: activeTab === 'video' ? '600' : 'normal',
                cursor: 'pointer'
              }}
            >
              🎥 Video
            </button>
            {hasQuiz && (
              <button
                onClick={() => setActiveTab('quiz')}
                style={{
                  padding: '1rem 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'quiz' ? '3px solid #4A90E2' : '3px solid transparent',
                  color: activeTab === 'quiz' ? '#4A90E2' : '#64748B',
                  fontWeight: activeTab === 'quiz' ? '600' : 'normal',
                  cursor: 'pointer'
                }}
              >
                🧠 Quiz {courseDetails.quiz_questions?.length && `(${courseDetails.quiz_questions.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="course-modal-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3>About this course</h3>
              <p style={{ 
                lineHeight: 1.6, 
                color: '#4B5563', 
                marginBottom: '2rem' 
              }}>
                {courseDetails.description}
              </p>
              
              {courseDetails.transcript_summary && (
                <div>
                  <h4>What you'll learn</h4>
                  <p style={{ 
                    lineHeight: 1.6, 
                    color: '#4B5563',
                    background: '#F8FAFC',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    marginBottom: '2rem'
                  }}>
                    {courseDetails.transcript_summary}
                  </p>
                </div>
              )}

              {courseDetails.tags && courseDetails.tags.length > 0 && (
                <div>
                  <h4>Tags</h4>
                  <div className="tags-container">
                    {courseDetails.tags.map((tag, index) => (
                      <span key={index} className="tag-item">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Progress Info */}
              {userRole === 'student' && (
                <div style={{
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginTop: '2rem'
                }}>
                  <h4 style={{ color: '#0369A1', marginBottom: '1rem' }}>Your Progress</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369A1' }}>
                        {Math.round(courseDetails.video_watch_percentage || 0)}%
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Video Progress</div>
                    </div>
                    {hasQuiz && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369A1' }}>
                          {courseDetails.quiz_score ? Math.round(courseDetails.quiz_score) : 0}%
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Best Quiz Score</div>
                      </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369A1' }}>
                        {courseDetails.quiz_attempts || 0}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Quiz Attempts</div>
                    </div>
                  </div>
                </div>
              )}

              {hasQuiz && (
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                  marginTop: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>Quiz available</div>
                    <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>You can attempt the quiz from the Video tab after the video section.</div>
                  </div>
                  <button className="course-btn btn-secondary" onClick={() => setActiveTab('video')}>
                    Go to Video
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Video Tab */}
          {activeTab === 'video' && (
            <div>
              <div className="video-container">
                <iframe
                  src={getYouTubeEmbedUrl(courseDetails.videoUrl || courseDetails.youtube_url)}
                  title={courseDetails.title}
                  allowFullScreen
                  onLoad={() => {
                    // Simulate video progress tracking
                    if (userRole === 'student') {
                      setTimeout(() => updateVideoProgress(25), 30000); // 25% after 30s
                      setTimeout(() => updateVideoProgress(50), 120000); // 50% after 2min
                      setTimeout(() => updateVideoProgress(75), 300000); // 75% after 5min
                      setTimeout(() => updateVideoProgress(100), 600000); // 100% after 10min
                    }
                  }}
                />
              </div>
              
              {courseDetails.transcript_summary && (
                <div>
                  <h4>Video Summary</h4>
                  <div style={{
                    background: '#F8FAFC',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #4A90E2'
                  }}>
                    <p style={{ margin: 0, lineHeight: 1.6, color: '#4B5563' }}>
                      {courseDetails.transcript_summary}
                    </p>
                  </div>
                </div>
              )}

              {hasQuiz ? (
                <div style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem'
                }}>
                  <div style={{ color: '#374151' }}>
                    <div style={{ fontWeight: 600 }}>Ready to take the quiz?</div>
                    <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                      {userRole === 'student' && (courseDetails.video_watch_percentage || 0) < 90 && !videoCompleted
                        ? `We recommend completing the video first. Current progress: ${Math.round(courseDetails.video_watch_percentage || 0)}%`
                        : `This quiz has ${courseDetails.quiz_questions?.length || 0} question(s).`}
                    </div>
                  </div>
                  <button
                    className="course-btn btn-primary"
                    onClick={handleStartQuiz}
                    title="Start the course quiz"
                  >
                    Attempt Quiz
                  </button>
                </div>
              ) : (
                <div style={{
                  marginTop: '1.5rem',
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#6B7280'
                }}>
                  This course doesn’t have a quiz yet.
                </div>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && hasQuiz && (
            <div>
              {!quizResults ? (
                <div className="quiz-container">
                  <div className="quiz-header">
                    <h3 className="quiz-title">Course Quiz</h3>
                    <p className="quiz-subtitle">
                      Test your understanding of the course material
                    </p>
                  </div>

                  {courseDetails.quiz_questions.map((question, qIndex) => (
                    <div key={question.id} className="quiz-question">
                      <div className="question-header">
                        <span className="question-number">Q{qIndex + 1}</span>
                        <span className="question-points">{question.points} point(s)</span>
                      </div>
                      
                      <p className="question-text">{question.question_text}</p>
                      
                      <div className="quiz-options">
                        {question.question_type === 'multiple_choice' && question.options?.map((option, oIndex) => (
                          <label 
                            key={oIndex} 
                            className={`quiz-option ${quizAnswers[question.id] === option ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={quizAnswers[question.id] === option}
                              onChange={() => handleQuizAnswer(question.id, option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                        
                        {question.question_type === 'true_false' && (
                          <>
                            <label className={`quiz-option ${quizAnswers[question.id] === 'True' ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value="True"
                                checked={quizAnswers[question.id] === 'True'}
                                onChange={() => handleQuizAnswer(question.id, 'True')}
                              />
                              <span>True</span>
                            </label>
                            <label className={`quiz-option ${quizAnswers[question.id] === 'False' ? 'selected' : ''}`}>
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value="False"
                                checked={quizAnswers[question.id] === 'False'}
                                onChange={() => handleQuizAnswer(question.id, 'False')}
                              />
                              <span>False</span>
                            </label>
                          </>
                        )}
                        
                        {question.question_type === 'short_answer' && (
                          <input
                            type="text"
                            placeholder="Type your answer..."
                            value={quizAnswers[question.id] || ''}
                            onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '2px solid #E5E7EB',
                              borderRadius: '8px',
                              fontSize: '1rem'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="quiz-controls">
                    <div className="quiz-timer">
                      ⏱️ Time: {formatTime(quizTimer)}
                    </div>
                    <button
                      className="quiz-submit-btn"
                      onClick={submitQuiz}
                      disabled={!allQuestionsAnswered || isSubmittingQuiz}
                    >
                      {isSubmittingQuiz ? (
                        <>
                          <div className="loading-spinner"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Quiz'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // Quiz Results
                <div className="quiz-results">
                  <div className={`result-icon ${quizResults.passed ? 'passed' : 'failed'}`}>
                    {quizResults.passed ? '🎉' : '📚'}
                  </div>
                  <div className={`result-score ${quizResults.passed ? 'passed' : 'failed'}`}>
                    {Math.round(quizResults.percentage)}%
                  </div>
                  <div className="result-message">
                    {quizResults.passed 
                      ? 'Congratulations! You passed the quiz!'
                      : 'Keep studying! You can retake the quiz anytime.'
                    }
                  </div>
                  
                  <div className="result-details">
                    <div className="result-stat">
                      <div className="stat-value">{quizResults.score}</div>
                      <div className="stat-label">Score</div>
                    </div>
                    <div className="result-stat">
                      <div className="stat-value">{quizResults.maxScore}</div>
                      <div className="stat-label">Total Points</div>
                    </div>
                    <div className="result-stat">
                      <div className="stat-value">{formatTime(quizTimer)}</div>
                      <div className="stat-label">Time Taken</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                    <button
                      onClick={() => {
                        setQuizResults(null);
                        setQuizAnswers({});
                        setQuizTimer(0);
                      }}
                      className="quiz-submit-btn"
                      style={{ background: 'linear-gradient(135deg, #4A90E2, #5BA3F5)' }}
                    >
                      Retake Quiz
                    </button>
                    <button onClick={onClose} className="course-btn btn-secondary">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
