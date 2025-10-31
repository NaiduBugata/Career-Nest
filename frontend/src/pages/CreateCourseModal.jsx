import React, { useState } from 'react';
import config from '../config';

const CreateCourseModal = ({ isOpen, onClose, onCourseCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    duration: '',
    youtube_url: '',
    difficulty_level: 'Beginner',
    category: '',
    tags: '',
    transcriptSummary: ''
  });
  const [quizQuestions, setQuizQuestions] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addQuizQuestion = () => {
    setQuizQuestions(prev => [
      ...prev,
      {
        id: Date.now(),
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1
      }
    ]);
  };

  const updateQuizQuestion = (questionId, field, value) => {
    setQuizQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    );
  };

  const updateQuestionOption = (questionId, optionIndex, value) => {
    setQuizQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              )
            }
          : q
      )
    );
  };

  const removeQuizQuestion = (questionId) => {
    setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare the course data
      const courseData = {
        title: formData.title,
        description: formData.description,
        instructor: formData.instructor || '',
        duration: formData.duration || '',
        youtube_url: formData.youtube_url,
        difficulty_level: formData.difficulty_level,
        category: formData.category || '',
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        transcript_summary: formData.transcriptSummary || '',
        quiz_questions: quizQuestions.map(q => ({
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.options.filter(opt => opt.trim()),
          correct_answer: q.correctAnswer,
          points: parseInt(q.points) || 1
        })).filter(q => q.question_text && q.correct_answer)
      };

      console.log('Sending course data:', courseData);

      const response = await fetch('${config.API_URL}/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Course created successfully!');
        // Reset form
        setFormData({
          title: '',
          description: '',
          instructor: '',
          duration: '',
          youtube_url: '',
          difficulty_level: 'Beginner',
          category: '',
          tags: '',
          transcriptSummary: ''
        });
        setQuizQuestions([]);
        onCourseCreated();
        onClose();
      } else {
        console.error('Course creation failed:', data);
        let errorMessage = `❌ Failed to create course: ${data.message}`;
        if (data.errors && data.errors.length > 0) {
          errorMessage += '\n\nValidation errors:';
          data.errors.forEach(error => {
            errorMessage += `\n- ${error.msg} (${error.param})`;
          });
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('❌ Failed to create course. Please check your connection.');
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
          <h2>Create New Course</h2>
          <p style={{ opacity: 0.9, marginTop: '0.5rem' }}>
            Build an engaging course with video content and interactive quiz
          </p>
        </div>

        <div className="course-modal-body">
          <form onSubmit={handleSubmit} className="course-form">
            {/* Basic Course Information */}
            <div className="form-section">
              <h3>📚 Course Information</h3>
              
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Describe what students will learn in this course"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Instructor</label>
                  <input
                    type="text"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Instructor name (optional)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., 4 weeks, 2 hours"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">YouTube URL *</label>
                  <input
                    type="url"
                    name="youtube_url"
                    value={formData.youtube_url}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Difficulty Level</label>
                  <select
                    name="difficulty_level"
                    value={formData.difficulty_level}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Programming, Design, Marketing"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="javascript, react, web development"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transcript Summary</label>
                <textarea
                  name="transcriptSummary"
                  value={formData.transcriptSummary}
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Provide a summary of what's covered in the video"
                  rows="4"
                />
              </div>
            </div>

            {/* Quiz Section */}
            <div className="form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>🧠 Quiz Questions (Optional)</h3>
                <button
                  type="button"
                  onClick={addQuizQuestion}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  + Add Question
                </button>
              </div>

              {quizQuestions.map((question, index) => (
                <div key={question.id} className="quiz-question-form">
                  <div className="question-header">
                    <h4>Question {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeQuizQuestion(question.id)}
                      className="btn-danger-small"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question Text *</label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) => updateQuizQuestion(question.id, 'questionText', e.target.value)}
                      className="form-input"
                      placeholder="Enter your question"
                      rows="2"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Question Type</label>
                      <select
                        value={question.questionType}
                        onChange={(e) => updateQuizQuestion(question.id, 'questionType', e.target.value)}
                        className="form-select"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Points</label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuizQuestion(question.id, 'points', e.target.value)}
                        className="form-input"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  {question.questionType === 'multiple_choice' && (
                    <div className="form-group">
                      <label className="form-label">Answer Options</label>
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateQuestionOption(question.id, optIndex, e.target.value)}
                            className="form-input"
                            placeholder={`Option ${optIndex + 1}`}
                            style={{ flex: 1 }}
                          />
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === option}
                              onChange={() => updateQuizQuestion(question.id, 'correctAnswer', option)}
                            />
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
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating Course...' : '📚 Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourseModal;
