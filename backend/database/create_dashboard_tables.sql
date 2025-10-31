-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('hackathon', 'quiz', 'coding', 'workshop', 'seminar', 'conference') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    venue VARCHAR(255) NOT NULL,
    max_participants INT NOT NULL,
    requirements TEXT,
    prizes TEXT,
    registration_deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'cancelled', 'completed') DEFAULT 'registered',
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (event_id, student_id)
);

-- Create organization_students table to manage which students belong to which organization
CREATE TABLE IF NOT EXISTS organization_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    student_id INT NOT NULL,
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (organization_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_org_student (organization_id, student_id)
);