-- Update students with course and year information

-- Update existing TechCorp students
UPDATE users SET course = 'Computer Science', year = '3rd' WHERE username = 'john_doe';
UPDATE users SET course = 'Information Technology', year = '2nd' WHERE username = 'jane_smith';
UPDATE users SET course = 'Software Engineering', year = '4th' WHERE username = 'alex_wilson';

-- Update new TechCorp students
UPDATE users SET course = 'Computer Science', year = '2nd' WHERE username = 'david_kim';
UPDATE users SET course = 'Data Science', year = '3rd' WHERE username = 'lisa_chen';
UPDATE users SET course = 'Software Engineering', year = '1st' WHERE username = 'mark_taylor';
UPDATE users SET course = 'Cybersecurity', year = '4th' WHERE username = 'anna_rodriguez';
UPDATE users SET course = 'Computer Science', year = '2nd' WHERE username = 'kevin_lee';
UPDATE users SET course = 'Artificial Intelligence', year = '3rd' WHERE username = 'sophia_wang';
UPDATE users SET course = 'Information Technology', year = '1st' WHERE username = 'ryan_johnson';

-- Update other students too for completeness
UPDATE users SET course = 'Computer Science', year = '1st' WHERE username = 'sarah_jones';
UPDATE users SET course = 'Data Science', year = '2nd' WHERE username = 'mike_brown';
UPDATE users SET course = 'Software Engineering', year = '4th' WHERE username = 'emily_davis';
UPDATE users SET course = 'Computer Science', year = '2nd' WHERE username = 'testuser';

-- Verify TechCorp students with their course and year info
SELECT 
    u.username as student_name,
    u.email,
    u.course,
    u.year
FROM organization_students os 
JOIN users u ON os.student_id = u.id 
WHERE os.organization_id = 1
ORDER BY u.course, u.year, u.username;