const { validationResult } = require('express-validator');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const User = require('../models/User');
const OrganizationStudent = require('../models/OrganizationStudent');

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

// Generate mock transcript summary
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
    
    let query = { isActive: true };
    
    if (userRole === 'admin') {
      // Admin sees all courses (no filter)
    } else if (userRole === 'organization') {
      // Organization sees admin courses + their own courses
      query.$or = [
        { createdByRole: 'admin' },
        { organizationId: userId }
      ];
    } else if (userRole === 'student') {
      // Students see admin courses + courses from their organization
      const orgStudent = await OrganizationStudent.findOne({ 
        studentId: userId, 
        status: 'active' 
      });
      
      const orgId = orgStudent ? orgStudent.organizationId : null;
      
      query.$or = [
        { createdByRole: 'admin' },
        { organizationId: orgId }
      ];
    }
    
    const courses = await Course.find(query)
      .populate('createdBy', 'username')
      .populate('organizationId', 'username')
      .sort({ createdAt: -1 })
      .lean();
    
    // If student, include enrollment data
    if (userRole === 'student') {
      const enrollments = await CourseEnrollment.find({ studentId: userId }).lean();
      const enrollmentMap = {};
      enrollments.forEach(e => {
        enrollmentMap[e.courseId.toString()] = e;
      });
      
      courses.forEach(course => {
        const enrollment = enrollmentMap[course._id.toString()];
        if (enrollment) {
          course.is_enrolled = true;
          course.is_completed = enrollment.completed;
          course.quiz_score = enrollment.quizScore;
          course.video_watch_percentage = enrollment.progress;
        }
      });
    }
    
    res.json({
      success: true,
      data: courses.map(c => ({
        ...c,
        id: c._id,
        created_by_name: c.createdBy?.username,
        organization_name: c.organizationId?.username
      }))
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
      instructor,
      duration,
      difficulty_level,  // From validation
      level,             // Alternate field name
      category,
      thumbnail,
      youtube_url,       // From validation
      videoUrl,          // Alternate field name
      materials,
      quiz_questions,    // From validation
      quizData           // Alternate field name
    } = req.body;
    
    // Normalize and provide safe defaults for required model fields
    const rawLevel = difficulty_level || level || 'Beginner';
    const normalizedLevel = String(rawLevel).toLowerCase();

    const courseData = {
      title,
      description,
      instructor: instructor || req.user.username || 'Anonymous',
      // Model requires duration; default to a sensible value if not provided by UI
      duration: duration || 'Self-paced',
      // Model requires enum ['beginner','intermediate','advanced']
      level: normalizedLevel,
      // Model requires category; default to 'General' if empty/undefined
      category: category && String(category).trim() ? category : 'General',
      thumbnail,
      videoUrl: youtube_url || videoUrl,
      materials,
      quizData: quiz_questions || quizData,
      createdBy: userId,
      createdByRole: userRole,
      organizationId: userRole === 'organization' ? userId : null,
      isActive: true
    };
    
    console.log('📝 Creating course with data:', courseData);
    
    const course = new Course(courseData);
    await course.save();
    
    // Populate creator info
    await course.populate('createdBy', 'username');
    
    console.log('✅ Course created successfully:', course._id);
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        ...course.toObject(),
        id: course._id,
        created_by_name: course.createdBy?.username
      }
    });
    
  } catch (error) {
    console.error('❌ Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get course details
const getCourseDetails = async (req, res) => {
  try {
    console.log('📖 Getting course details for course ID:', req.params.courseId);
    
    const courseId = req.params.courseId;
    
    const course = await Course.findOne({ _id: courseId, isActive: true })
      .populate('createdBy', 'username')
      .lean();
    
    if (!course) {
      console.log('❌ Course not found:', courseId);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    console.log('✅ Found course:', course.title);
    
    // If requester is a student, include their progress/enrollment
    if (req.user && req.user.role === 'student') {
      const enrollment = await CourseEnrollment.findOne({
        courseId: courseId,
        studentId: req.user.userId
      }).lean();
      
      if (enrollment) {
        course.is_enrolled = true;
        course.is_completed = enrollment.completed;
        course.quiz_score = enrollment.quizScore;
        course.video_watch_percentage = enrollment.progress;
      }
    }
    
    console.log('✅ Returning course details');
    
    res.json({
      success: true,
      data: {
        ...course,
        id: course._id,
        created_by_name: course.createdBy?.username,
        quiz_questions: course.quizData || []
      }
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

// Enroll student in course
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
    
    // Check if course exists
    const course = await Course.findOne({ _id: courseId, isActive: true });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if already enrolled
    const existing = await CourseEnrollment.findOne({ 
      studentId, 
      courseId 
    });
    
    console.log('🔍 Existing enrollment check:', { found: !!existing });
    
    if (existing) {
      console.log('ℹ️ Student already enrolled in course');
      return res.json({
        success: true,
        message: 'Already enrolled in this course'
      });
    }
    
    // Create enrollment
    console.log('➕ Creating new enrollment record');
    const enrollment = new CourseEnrollment({
      courseId,
      studentId,
      progress: 0,
      completed: false
    });
    await enrollment.save();
    
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
    
    // Get course with quiz data
    const course = await Course.findOne({ _id: courseId, isActive: true });
    if (!course || !course.quizData) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this course'
      });
    }
    
    const questions = Array.isArray(course.quizData) ? course.quizData : [];
    
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
    
    questions.forEach((q, index) => {
      const points = q.points || 1;
      maxScore += points;
      const studentAnswer = answersArray.find(a => a.question_id === index || a.question_id === q.id);
      if (studentAnswer && studentAnswer.answer === q.correct_answer) {
        totalScore += points;
      }
    });
    
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    // Update or create enrollment with quiz score
    let enrollment = await CourseEnrollment.findOne({ studentId, courseId });
    
    if (!enrollment) {
      enrollment = new CourseEnrollment({
        courseId,
        studentId,
        progress: 0,
        completed: false
      });
    }
    
    // Update quiz score (keep best score)
    enrollment.quizScore = Math.max(enrollment.quizScore || 0, percentage);
    
    // Check if course should be marked complete (100% video + 70% quiz)
    if (enrollment.progress >= 100 && percentage >= 70) {
      enrollment.completed = true;
      enrollment.completionDate = new Date();
    }
    
    await enrollment.save();
    
    console.log('Quiz submitted:', { studentId, courseId, percentage, completed: enrollment.completed });
    
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
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    
    // Find or create enrollment
    let enrollment = await CourseEnrollment.findOne({ studentId, courseId });
    
    if (!enrollment) {
      enrollment = new CourseEnrollment({
        courseId,
        studentId,
        progress: percentage,
        completed: false
      });
    } else {
      // Keep the highest progress
      enrollment.progress = Math.max(enrollment.progress, percentage);
    }
    
    // Check if should mark as complete (100% video + quiz requirement if exists)
    const course = await Course.findById(courseId);
    const hasQuiz = course && course.quizData && Array.isArray(course.quizData) && course.quizData.length > 0;
    
    if (hasQuiz) {
      // Has quiz: need 100% video + 70% quiz
      if (enrollment.progress >= 100 && (enrollment.quizScore || 0) >= 70) {
        enrollment.completed = true;
        enrollment.completionDate = new Date();
      }
    } else {
      // No quiz: just need 100% video
      if (enrollment.progress >= 100) {
        enrollment.completed = true;
        enrollment.completionDate = new Date();
      }
    }
    
    await enrollment.save();
    
    console.log('Video progress updated:', { 
      studentId, 
      courseId, 
      progress: enrollment.progress, 
      completed: enrollment.completed 
    });
    
    res.json({
      success: true,
      message: 'Video progress updated',
      data: {
        progress: enrollment.progress,
        completed: enrollment.completed
      }
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
    const course = await Course.findOne({ _id: courseId, isActive: true });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isAdmin = userRole === 'admin';
    const isOwnerOrg = userRole === 'organization' && (
      (course.organizationId && course.organizationId.toString() === userId) ||
      (course.createdByRole === 'organization' && course.createdBy.toString() === userId)
    );

    if (!isAdmin && !isOwnerOrg) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
    }

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const {
      title,
      description,
      instructor,
      duration,
      difficulty_level,
      level,
      category,
      thumbnail,
      youtube_url,
      videoUrl,
      materials,
      quiz_questions,
      quizData
    } = req.body;

    // Update course fields (only when provided); keep existing otherwise
    if (typeof title !== 'undefined') course.title = title;
    if (typeof description !== 'undefined') course.description = description;
    if (typeof instructor !== 'undefined') course.instructor = instructor || course.instructor;
    if (typeof duration !== 'undefined') course.duration = duration || course.duration;
    if (typeof difficulty_level !== 'undefined' || typeof level !== 'undefined') {
      const rawLevel = difficulty_level || level;
      if (rawLevel) {
        course.level = String(rawLevel).toLowerCase();
      }
    }
    if (typeof category !== 'undefined') {
      course.category = category && String(category).trim() ? category : course.category;
    }
    if (typeof thumbnail !== 'undefined') course.thumbnail = thumbnail;
    if (typeof youtube_url !== 'undefined' || typeof videoUrl !== 'undefined') {
      course.videoUrl = youtube_url || videoUrl || course.videoUrl;
    }
    if (typeof materials !== 'undefined') course.materials = materials;
    if (typeof quiz_questions !== 'undefined' || typeof quizData !== 'undefined') {
      course.quizData = quiz_questions || quizData;
    }

    await course.save();

    console.log('Course updated:', courseId);

    res.json({ success: true, message: 'Course updated successfully' });
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
    const course = await Course.findOne({ _id: courseId, isActive: true });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isAdmin = userRole === 'admin';
    const isOwnerOrg = userRole === 'organization' && (
      (course.organizationId && course.organizationId.toString() === userId) ||
      (course.createdByRole === 'organization' && course.createdBy.toString() === userId)
    );

    if (!isAdmin && !isOwnerOrg) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    // Soft delete
    course.isActive = false;
    await course.save();

    console.log('Course soft deleted:', courseId);

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
