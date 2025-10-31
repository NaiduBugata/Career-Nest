-- Create courses table with visibility scoping
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    youtube_url VARCHAR(500),
    video_id VARCHAR(50), -- extracted YouTube video ID
    transcript_summary TEXT,
    duration_minutes INT DEFAULT 0,
    difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
    category VARCHAR(100),
    tags JSON, -- ["programming", "web-dev", "javascript"]
    
    -- Visibility and ownership
    created_by_id INT NOT NULL,
    created_by_type ENUM('admin', 'organization') NOT NULL,
    organization_id INT NULL, -- NULL for admin courses, specific ID for org courses
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_visibility (created_by_type, organization_id, is_active),
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level)
);

-- Create quiz questions table
CREATE TABLE IF NOT EXISTS course_quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer') DEFAULT 'multiple_choice',
    options JSON, -- ["Option A", "Option B", "Option C", "Option D"] for multiple choice
    correct_answer VARCHAR(500) NOT NULL,
    explanation TEXT,
    points INT DEFAULT 1,
    order_index INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_order (course_id, order_index)
);

-- Create student course progress tracking
CREATE TABLE IF NOT EXISTS student_course_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    
    -- Progress tracking
    is_enrolled BOOLEAN DEFAULT TRUE,
    video_watched BOOLEAN DEFAULT FALSE,
    video_watch_percentage DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
    quiz_attempted BOOLEAN DEFAULT FALSE,
    quiz_score DECIMAL(5,2) DEFAULT 0.00, -- 0.00 to 100.00
    quiz_attempts INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_student_course (student_id, course_id),
    INDEX idx_student_progress (student_id, is_completed),
    INDEX idx_course_enrollment (course_id, is_enrolled)
);

-- Create quiz attempt history
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    
    -- Attempt data
    answers JSON, -- [{"question_id": 1, "answer": "Option A"}, ...]
    score DECIMAL(5,2) NOT NULL,
    max_score INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    time_taken_seconds INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    
    INDEX idx_student_attempts (student_id, course_id, created_at)
);