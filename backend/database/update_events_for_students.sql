-- Update events table to support student-created events
-- Add new columns for student event creation functionality

USE careernest;

-- Add columns to events table
ALTER TABLE events 
ADD COLUMN created_by_type ENUM('organization', 'student') DEFAULT 'organization' AFTER organization_id,
ADD COLUMN created_by_id INT AFTER created_by_type,
ADD COLUMN visibility ENUM('public', 'private') DEFAULT 'public' AFTER prizes,
ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' AFTER visibility,
ADD COLUMN event_code VARCHAR(8) UNIQUE AFTER approval_status,
ADD COLUMN approved_by INT AFTER event_code,
ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by;

-- Add foreign key constraints for new columns
ALTER TABLE events 
ADD CONSTRAINT fk_created_by_student 
FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE events 
ADD CONSTRAINT fk_approved_by 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create student_events table for tracking student-created events
CREATE TABLE IF NOT EXISTS student_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    event_id INT NOT NULL,
    is_creator BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_event (student_id, event_id)
);

-- Update existing events to have proper creator information
UPDATE events SET 
created_by_type = 'organization',
created_by_id = organization_id,
approval_status = 'approved'
WHERE created_by_type IS NULL OR created_by_id IS NULL;

-- Create indexes for better performance
CREATE INDEX idx_events_created_by ON events(created_by_type, created_by_id);
CREATE INDEX idx_events_visibility ON events(visibility);
CREATE INDEX idx_events_approval_status ON events(approval_status);
CREATE INDEX idx_events_code ON events(event_code);

SELECT 'Events table updated successfully for student event creation!' as message;