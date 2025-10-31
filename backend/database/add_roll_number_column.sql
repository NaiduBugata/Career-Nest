-- Add roll_number column to users table
-- This will fail gracefully if the column already exists
ALTER TABLE users 
ADD COLUMN roll_number VARCHAR(50) NULL AFTER year;

-- Add index for faster lookups
-- This will fail gracefully if the index already exists  
CREATE INDEX idx_roll_number ON users(roll_number);

-- Update existing students to have default roll numbers if needed
UPDATE users 
SET roll_number = CONCAT('STU', LPAD(id, 6, '0'))
WHERE role = 'student' AND (roll_number IS NULL OR roll_number = '');
