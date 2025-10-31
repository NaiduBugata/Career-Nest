-- Add more students to the database and assign them to TechCorp

-- First, add new student users
INSERT INTO users (username, email, password, role) VALUES 
('david_kim', 'david.kim@student.com', '$2a$12$3VScVf3mMf8e4TCKVo6RuONxqLDooqvxRxoyGYiDCNlguxUo9Oahe', 'student'),
('lisa_chen', 'lisa.chen@student.edu', '$2a$12$3VScVf3mMf8e4TCKVo6RuONxqLDooqvxRxoyGYiDCNlguxUo9Oahe', 'student'),
('mark_taylor', 'mark.taylor@gmail.com', '$2a$12$3VScVf3mMf8e4TCKVo6RuONxqLDooqvxRxoyGYiDCNlguxUo9Oahe', 'student'),
('anna_rodriguez', 'anna.rodriguez@outlook.com', '$2a$12$3VScVf3mMf8e4TCKVo6RuONxqLDooqvxRxoyGYiDCNlguxUo9Oahe', 'student'),
('kevin_lee', 'kevin.lee@student.com', '$2a$12$3VScVf3mMf8e4TCKVo6RuONxqLDooqvxRxoyGYiDCNlguxUo9Oahe', 'student'),
('sophia_wang', 'sophia.wang@university.edu', '$2a$12$3VScVf3mMf8e4TCKVo6RuONxqLDooqvxRxoyGYiDCNlguxUo9Oahe', 'student'),
('ryan_johnson', 'ryan.johnson@student.org', '$2a$12$3VScVf3mMf8e4TCKVo6RuONxqLDooqvxRxoyGYiDCNlguxUo9Oahe', 'student');
-- Password for all new students: Student123

-- Get the TechCorp organization ID (it should be 1)
-- Now assign all new students to TechCorp (organization_id = 1)
INSERT INTO organization_students (organization_id, student_id) 
SELECT 1, id FROM users WHERE username IN (
    'david_kim', 'lisa_chen', 'mark_taylor', 'anna_rodriguez', 
    'kevin_lee', 'sophia_wang', 'ryan_johnson'
) AND role = 'student';

-- Verify the new assignments
SELECT 
    u1.username as organization, 
    u2.username as student,
    u2.email as student_email
FROM organization_students os 
JOIN users u1 ON os.organization_id = u1.id 
JOIN users u2 ON os.student_id = u2.id 
WHERE u1.username = 'techcorp'
ORDER BY u2.username;