-- Add some sample announcements
INSERT INTO announcements (organization_id, title, content, priority) VALUES 
(1, 'Welcome to TechCorp Internship Program', 'We are excited to announce the start of our internship program. All students will receive comprehensive training in modern technologies.', 'high'),
(1, 'Weekly Team Meeting', 'All interns are requested to attend the weekly team meeting every Friday at 3 PM.', 'normal'),
(2, 'University Partnership Update', 'We are expanding our partnership program with additional courses and opportunities.', 'normal'),
(3, 'Startup Innovation Challenge', 'Join our innovation challenge and showcase your entrepreneurial skills!', 'urgent');

-- Add some sample events
INSERT INTO events (organization_id, title, description, type, start_date, end_date, venue, max_participants, requirements, prizes, registration_deadline) VALUES 
(1, 'TechCorp Annual Hackathon 2025', 'Join our flagship hackathon event where innovation meets competition. Work on real-world problems and showcase your technical skills.', 'hackathon', '2025-12-15', '2025-12-17', 'TechCorp Campus, Bangalore', 100, 'Basic programming knowledge, Team of 2-4 members', 'Winner: $5000, Runner-up: $2000, Special mentions: $500', '2025-12-01'),
(1, 'Weekly Quiz Competition', 'Test your knowledge in programming, algorithms, and data structures.', 'quiz', '2025-11-20', '2025-11-20', 'Online Platform', 50, 'None', 'Winner: Gift vouchers worth $100', '2025-11-18'),
(2, 'AI/ML Workshop Series', 'Comprehensive workshop series covering Machine Learning fundamentals and applications.', 'workshop', '2025-11-25', '2025-11-27', 'University Auditorium', 75, 'Basic Python knowledge', 'Certificate of completion', '2025-11-20'),
(3, 'Startup Pitch Competition', 'Present your startup ideas to industry experts and investors.', 'seminar', '2025-12-10', '2025-12-10', 'Innovation Hub', 30, 'Business plan document', 'Winner: $10000 seed funding, Mentorship program', '2025-12-05');