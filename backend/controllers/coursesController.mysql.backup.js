const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

// Extract YouTube video ID from URL
const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Generate mock transcript summary (in real app, you'd use YouTube API or AI)
const generateTranscriptSummary = (videoId, title) => {
  const templates = [
    `This course covers the fundamentals of ${title}. Key topics include practical examples, best practices, and real-world applications. Students will learn through hands-on exercises and comprehensive explanations.`,
    `An in-depth exploration of ${title} concepts. The video demonstrates step-by-step processes, common pitfalls to avoid, and advanced techniques. Perfect for both beginners and intermediate learners.`,
    `Comprehensive tutorial on ${title}. Covers theoretical foundations, practical implementations, and industry standards. Includes examples, case studies, and actionable insights.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
};

// Get all courses visible to the current user
const getCourses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    let query;
    let params = [];
    
    if (userRole === 'admin') {
      // Admin sees all courses
      query = `
        SELECT c.*, u.username as created_by_name,
               org.username as organization_name
        FROM courses c
        LEFT JOIN users u ON c.created_by_id = u.id
        LEFT JOIN users org ON c.organization_id = org.id
        WHERE c.is_active = TRUE
        ORDER BY c.created_at DESC
      `;
    } else if (userRole === 'organization') {
      // Organization sees admin courses + their own courses
      query = `
        SELECT c.*, u.username as created_by_name,
               org.username as organization_name
        FROM courses c
        LEFT JOIN users u ON c.created_by_id = u.id
        LEFT JOIN users org ON c.organization_id = org.id
        WHERE c.is_active = TRUE 
        AND (c.created_by_type = 'admin' OR c.organization_id = ?)
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    } else if (userRole === 'student') {
      // Students see admin courses + courses from their organization
      const [studentOrg] = await pool.execute(
        'SELECT organization_id FROM organization_students WHERE student_id = ? AND status = "active"',
        [userId]
      );
      
      const orgId = studentOrg.length > 0 ? studentOrg[0].organization_id : null;
      
      query = `
        SELECT c.*, u.username as created_by_name,
               org.username as organization_name,
               scp.is_enrolled, scp.is_completed, scp.quiz_score,
               scp.video_watch_percentage
        FROM courses c
        LEFT JOIN users u ON c.created_by_id = u.id
        LEFT JOIN users org ON c.organization_id = org.id
        LEFT JOIN student_course_progress scp ON c.id = scp.course_id AND scp.student_id = ?
        WHERE c.is_active = TRUE 
        AND (c.created_by_type = 'admin' OR c.organization_id = ?)
        ORDER BY c.created_at DESC
      `;
      params = [userId, orgId];
    }
    
    const [courses] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: courses
    });
    
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new course (admin or organization)
const createCourse = async (req, res) => {
  try {
    console.log('📚 Creating course with data:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    console.log(`👤 User creating course: ID=${userId}, Role=${userRole}`);
    
    if (!['admin', 'organization'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and organizations can create courses'
      });
    }
    
    const {
      title,
      description,
      youtube_url,
      difficulty_level,
      category,
      tags,
      quiz_questions
    } = req.body;
    
    const videoId = extractYouTubeVideoId(youtube_url);
    const transcriptSummary = generateTranscriptSummary(videoId, title);
    const organizationId = userRole === 'organization' ? userId : null;
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : null;
    
    console.log('🎥 Extracted video ID:', videoId);
    console.log('📝 Generated transcript summary:', transcriptSummary);
    console.log('🏢 Organization ID:', organizationId);
    console.log('🏷️ Tags JSON:', tagsJson);
    
    const connection = await pool.getConnection();
    console.log('🔗 Database connection acquired');
    
    try {
      await connection.beginTransaction();
      console.log('🔄 Transaction started');
      
      // Insert course
      const courseQuery = `
        INSERT INTO courses (
          title, description, youtube_url, video_id, transcript_summary,
          difficulty_level, category, tags, created_by_id, created_by_type,
          organization_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const courseParams = [
        title, description, youtube_url, videoId, transcriptSummary,
        difficulty_level, category, tagsJson, userId, userRole,
        organizationId
      ];
      
      console.log('📝 Executing course insert query:', courseQuery);
      console.log('📝 Course params:', courseParams);
      
      const [courseResult] = await connection.execute(courseQuery, courseParams);
      console.log('✅ Course inserted with ID:', courseResult.insertId);
      
      const courseId = courseResult.insertId;
      
      // Insert quiz questions if provided
      if (Array.isArray(quiz_questions) && quiz_questions.length > 0) {
        console.log(`📝 Inserting ${quiz_questions.length} quiz questions`);
        for (let i = 0; i < quiz_questions.length; i++) {
          const q = quiz_questions[i];
          const optionsJson = Array.isArray(q.options) ? JSON.stringify(q.options) : null;
          
          console.log(`📝 Question ${i + 1}:`, {
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer
          });
          
          await connection.execute(`
            INSERT INTO course_quiz_questions (
              course_id, question_text, question_type, options, 
              correct_answer, explanation, points, order_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            courseId, q.question_text, q.question_type || 'multiple_choice',
            optionsJson, q.correct_answer, q.explanation || '',
            q.points || 1, i
          ]);
        }
        console.log('✅ All quiz questions inserted');
      } else {
        console.log('ℹ️ No quiz questions to insert');
      }
      
      await connection.commit();
      console.log('✅ Transaction committed successfully');
      
      // Get the created course with details
      const [course] = await connection.execute(`
        SELECT c.*, u.username as created_by_name
        FROM courses c
        LEFT JOIN users u ON c.created_by_id = u.id
        WHERE c.id = ?
      `, [courseId]);
      
      console.log('📚 Course created successfully:', course[0]);
      
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course[0]
      });
      
    } catch (error) {
      console.error('❌ Database error during course creation:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
      console.log('🔗 Database connection released');
    }
    
  } catch (error) {
    console.error('❌ Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get course details with quiz questions - SIMPLIFIED VERSION
const getCourseDetails = async (req, res) => {
  try {
    console.log('📖 Getting course details for course ID:', req.params.courseId);
    
    const courseId = req.params.courseId;
    
    // Get course info, and if requester is a student, include their progress/enrollment
    let courses;
    if (req.user && req.user.role === 'student') {
      const studentId = req.user.userId;
      [courses] = await pool.execute(`
        SELECT c.*, u.username as created_by_name,
               scp.is_enrolled, scp.is_completed, scp.quiz_score, scp.video_watch_percentage
        FROM courses c
        LEFT JOIN users u ON c.created_by_id = u.id
        LEFT JOIN student_course_progress scp ON scp.course_id = c.id AND scp.student_id = ?
        WHERE c.id = ? AND c.is_active = TRUE
      `, [studentId, courseId]);
    } else {
      [courses] = await pool.execute(`
        SELECT c.*, u.username as created_by_name
        FROM courses c
        LEFT JOIN users u ON c.created_by_id = u.id
        WHERE c.id = ? AND c.is_active = TRUE
      `, [courseId]);
    }
    
    if (courses.length === 0) {
      console.log('❌ Course not found:', courseId);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const course = courses[0];
    console.log('✅ Found course:', course.title);
    
    // Get quiz questions (simplified)
    const [questions] = await pool.execute(`
      SELECT id, question_text, question_type, options, explanation, points, order_index
      FROM course_quiz_questions 
      WHERE course_id = ? 
      ORDER BY order_index ASC
    `, [courseId]);
    
    console.log('📝 Found', questions.length, 'quiz questions');
    
    // Add quiz questions; parse options if stored as JSON text
    course.quiz_questions = (questions || []).map(q => ({
      ...q,
      options: (() => {
        if (!q.options) return null;
        try { return typeof q.options === 'string' ? JSON.parse(q.options) : q.options; }
        catch { return q.options; }
      })()
    }));
    course.tags = [];
    
    console.log('✅ Returning course details');
    
    res.json({
      success: true,
      data: course
    });
    
  } catch (error) {
    console.error('❌ Get course details error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course details',
      error: error.message
    });
  }
};

// Enroll student in course (auto-enrollment)
const enrollInCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.userId;
    
    console.log('🎯 Enrollment request:', { courseId, studentId, userRole: req.user.role });
    
    if (req.user.role !== 'student') {
      console.log('❌ Non-student tried to enroll:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Only students can enroll in courses'
      });
    }
    
    // Check if already enrolled
    const [existing] = await pool.execute(
      'SELECT id FROM student_course_progress WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    
    console.log('🔍 Existing enrollment check:', { found: existing.length > 0 });
    
    if (existing.length > 0) {
      console.log('ℹ️ Student already enrolled in course');
      return res.json({
        success: true,
        message: 'Already enrolled in this course'
      });
    }
    
    // Enroll student
    console.log('➕ Creating new enrollment record');
    await pool.execute(`
      INSERT INTO student_course_progress (student_id, course_id, is_enrolled) 
      VALUES (?, ?, TRUE)
    `, [studentId, courseId]);
    
    console.log('✅ Enrollment successful');
    res.json({
      success: true,
      message: 'Successfully enrolled in course'
    });
    
  } catch (error) {
    console.error('❌ Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit quiz attempt
const submitQuizAttempt = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.userId;
    const { answers, timeTakenSeconds } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can submit quiz attempts'
      });
    }
    
    // Get quiz questions with correct answers
    const [questions] = await pool.execute(`
      SELECT id, correct_answer, points
      FROM course_quiz_questions 
      WHERE course_id = ? 
      ORDER BY order_index ASC
    `, [courseId]);
    
    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quiz questions found for this course'
      });
    }
    
    // Calculate score
    let totalScore = 0;
    let maxScore = 0;
    const answersArray = Array.isArray(answers) ? answers : [];
    
    questions.forEach(q => {
      maxScore += q.points;
      const studentAnswer = answersArray.find(a => a.question_id === q.id);
      if (studentAnswer && studentAnswer.answer === q.correct_answer) {
        totalScore += q.points;
      }
    });
    
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Record quiz attempt
      await connection.execute(`
        INSERT INTO quiz_attempts (
          student_id, course_id, answers, score, max_score, 
          percentage, time_taken_seconds
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        studentId, courseId, JSON.stringify(answersArray), 
        totalScore, maxScore, percentage, timeTakenSeconds || 0
      ]);
      
      // Update student progress
      await connection.execute(`
        INSERT INTO student_course_progress (
          student_id, course_id, is_enrolled, quiz_attempted, 
          quiz_score, quiz_attempts
        ) VALUES (?, ?, TRUE, TRUE, ?, 1)
        ON DUPLICATE KEY UPDATE
        quiz_attempted = TRUE,
        quiz_score = GREATEST(quiz_score, VALUES(quiz_score)),
        quiz_attempts = quiz_attempts + 1,
        last_accessed_at = CURRENT_TIMESTAMP
      `, [studentId, courseId, percentage]);
      
      await connection.commit();
      
      // Check if course is now complete after quiz submission
      try {
        const isComplete = await checkCourseCompletion(studentId, courseId);
        console.log('Course completion check after quiz submission:', { studentId, courseId, isComplete });
      } catch (completionError) {
        console.error('Failed to check completion after quiz submission:', completionError);
      }
      
      res.json({
        success: true,
        message: 'Quiz submitted successfully',
        data: {
          score: totalScore,
          maxScore: maxScore,
          percentage: Math.round(percentage * 100) / 100,
          passed: percentage >= 70 // 70% passing grade
        }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check and update course completion status
const checkCourseCompletion = async (studentId, courseId, connection = pool) => {
  try {
    // Get current progress
    const [progress] = await connection.execute(`
      SELECT video_watch_percentage, quiz_score 
      FROM student_course_progress 
      WHERE student_id = ? AND course_id = ?
    `, [studentId, courseId]);
    
    // Get course quiz questions count
    const [quizCount] = await connection.execute(`
      SELECT COUNT(*) as quiz_count 
      FROM course_quiz_questions 
      WHERE course_id = ?
    `, [courseId]);
    
    if (progress.length === 0) return false;
    
    const currentProgress = progress[0];
    const hasQuiz = quizCount[0].quiz_count > 0;
    const videoCompleted = (currentProgress.video_watch_percentage || 0) >= 100;
    const quizPassed = (currentProgress.quiz_score || 0) >= 70;
    
    let isCompleted = false;
    
    if (hasQuiz) {
      // Video + Quiz: Both video complete (100%) AND quiz passed (70%+)
      isCompleted = videoCompleted && quizPassed;
      console.log(`📊 Course ${courseId} - Has Quiz: Video ${currentProgress.video_watch_percentage}%, Quiz ${currentProgress.quiz_score}% - Completed: ${isCompleted}`);
    } else {
      // Video only: Just video complete (100%)
      isCompleted = videoCompleted;
      console.log(`📊 Course ${courseId} - Video Only: ${currentProgress.video_watch_percentage}% - Completed: ${isCompleted}`);
    }
    
    // Update completion status
    if (isCompleted) {
      await connection.execute(`
        UPDATE student_course_progress 
        SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP 
        WHERE student_id = ? AND course_id = ?
      `, [studentId, courseId]);
      console.log(`🎉 Course ${courseId} marked as completed for student ${studentId}`);
    }
    
    return isCompleted;
    
  } catch (error) {
    console.error('Error checking course completion:', error);
    return false;
  }
};

// Update video watch progress
const updateVideoProgress = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.userId;
    const { watchPercentage, watched } = req.body;
    
    console.log(`📺 Updating video progress - Course: ${courseId}, Student: ${studentId}, Percentage: ${watchPercentage}`);
    
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can update video progress'
      });
    }
    
    const percentage = Math.max(0, Math.min(100, watchPercentage || 0));
    
    await pool.execute(`
      INSERT INTO student_course_progress (
        student_id, course_id, is_enrolled, video_watch_percentage, last_accessed
      ) VALUES (?, ?, TRUE, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
      video_watch_percentage = GREATEST(video_watch_percentage, VALUES(video_watch_percentage)),
      last_accessed = CURRENT_TIMESTAMP
    `, [studentId, courseId, percentage]);
    
    // Check if course should be marked as completed
    await checkCourseCompletion(studentId, courseId);
    
    res.json({
      success: true,
      message: 'Video progress updated'
    });
    
  } catch (error) {
    console.error('Update video progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video progress',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a course (admin or owning organization)
const updateCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const courseId = req.params.courseId;

    // Fetch course to validate existence and ownership
    const [rows] = await pool.execute(`
      SELECT id, created_by_type, created_by_id, organization_id, is_active
      FROM courses
      WHERE id = ?
    `, [courseId]);

    if (rows.length === 0 || rows[0].is_active === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const course = rows[0];
    const isAdmin = userRole === 'admin';
    const isOwnerOrg = userRole === 'organization' && (
      (course.organization_id && course.organization_id === userId) ||
      (course.created_by_type === 'organization' && course.created_by_id === userId)
    );

    if (!isAdmin && !isOwnerOrg) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
    }

    // Basic validation similar to create; we expect all main fields present
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const {
      title,
      description,
      youtube_url,
      difficulty_level,
      category,
      tags,
      transcript_summary,
      quiz_questions
    } = req.body;

    const videoId = extractYouTubeVideoId(youtube_url);
    const transcriptSummary = transcript_summary || generateTranscriptSummary(videoId, title);
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : null;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Update course row
      await connection.execute(`
        UPDATE courses
        SET title = ?, description = ?, youtube_url = ?, video_id = ?, transcript_summary = ?,
            difficulty_level = ?, category = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        title, description, youtube_url, videoId, transcriptSummary,
        difficulty_level, category || null, tagsJson, courseId
      ]);

      // Replace quiz questions: delete and insert anew
      await connection.execute('DELETE FROM course_quiz_questions WHERE course_id = ?', [courseId]);
      if (Array.isArray(quiz_questions) && quiz_questions.length > 0) {
        for (let i = 0; i < quiz_questions.length; i++) {
          const q = quiz_questions[i];
          const optionsJson = Array.isArray(q.options) ? JSON.stringify(q.options) : null;
          await connection.execute(`
            INSERT INTO course_quiz_questions (
              course_id, question_text, question_type, options, correct_answer, explanation, points, order_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            courseId, q.question_text, q.question_type || 'multiple_choice', optionsJson,
            q.correct_answer, q.explanation || '', q.points || 1, i
          ]);
        }
      }

      await connection.commit();

      res.json({ success: true, message: 'Course updated successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ success: false, message: 'Failed to update course', error: error.message });
  }
};

// Delete (soft delete) a course
const deleteCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const courseId = req.params.courseId;

    // Fetch course to validate ownership
    const [rows] = await pool.execute(`
      SELECT id, created_by_type, created_by_id, organization_id, is_active
      FROM courses
      WHERE id = ?
    `, [courseId]);

    if (rows.length === 0 || rows[0].is_active === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    const course = rows[0];
    const isAdmin = userRole === 'admin';
    const isOwnerOrg = userRole === 'organization' && (
      (course.organization_id && course.organization_id === userId) ||
      (course.created_by_type === 'organization' && course.created_by_id === userId)
    );
    if (!isAdmin && !isOwnerOrg) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    await pool.execute('UPDATE courses SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [courseId]);
    return res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course', error: error.message });
  }
};

module.exports = {
  getCourses,
  createCourse,
  getCourseDetails,
  enrollInCourse,
  submitQuizAttempt,
  updateVideoProgress,
  updateCourse,
  deleteCourse
};