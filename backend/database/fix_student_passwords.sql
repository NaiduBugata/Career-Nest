-- Fix all student passwords with proper bcrypt hash
-- Password: Student123

UPDATE users SET password = '$2a$12$XWNsaaer6P0Cly3jl/QGV.NjX97v2NXpYmJzVMZwz8gVJEj2fCtoe' WHERE role = 'student';

-- Verify the update
SELECT username, CHAR_LENGTH(password) as pwd_length, role FROM users WHERE role = 'student' ORDER BY username;