-- SkillSwapper Database Setup
-- This file contains the database schema for the SkillSwapper application

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS skillswapper;
USE skillswapper;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    location VARCHAR(255),
    profile_pic VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User skills (skills they have/can teach)
CREATE TABLE IF NOT EXISTS user_skills_have (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill_have (user_id, skill_id)
);

-- User skills (skills they want to learn)
CREATE TABLE IF NOT EXISTS user_skills_want (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    urgency_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_skill_want (user_id, skill_id)
);

-- Matches table (saved connections)
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    matched_skills JSON,
    status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_match (user1_id, user2_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    skill_id INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    from_user_id INT,
    type ENUM('connection_request', 'connection_accepted', 'connection_declined', 'message', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_user_created (user_id, created_at)
);

-- Insert some sample skills
INSERT IGNORE INTO skills (skill_name, category) VALUES
('JavaScript', 'Programming'),
('Python', 'Programming'),
('React', 'Frontend'),
('Node.js', 'Backend'),
('SQL', 'Database'),
('HTML/CSS', 'Frontend'),
('Java', 'Programming'),
('C++', 'Programming'),
('Machine Learning', 'AI/ML'),
('Data Analysis', 'Data Science'),
('Photoshop', 'Design'),
('Figma', 'Design'),
('Git', 'Version Control'),
('Docker', 'DevOps'),
('AWS', 'Cloud Computing'),
('Spanish', 'Language'),
('French', 'Language'),
('German', 'Language'),
('Chinese', 'Language'),
('Guitar', 'Music'),
('Piano', 'Music'),
('Cooking', 'Life Skills'),
('Photography', 'Creative'),
('Writing', 'Creative'),
('Public Speaking', 'Communication');

