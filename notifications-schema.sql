-- Notifications table for SkillSwapper
-- Integrates with existing schema structure

USE skillswapper;

-- Notifications table - Track user notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    from_user_id INT,
    type ENUM('connection_request', 'connection_accepted', 'connection_declined', 'message', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON, -- Store additional data like match details, user info, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_unread (user_id, is_read),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
);

-- Optional: Create a view for notification summary (similar to your user_skill_summary)
CREATE VIEW notification_summary AS
SELECT 
    n.id,
    n.user_id,
    n.from_user_id,
    n.type,
    n.title,
    n.message,
    n.is_read,
    n.created_at,
    n.read_at,
    u_from.name as from_user_name,
    u_from.profile_pic as from_user_pic,
    u_to.name as to_user_name
FROM notifications n
LEFT JOIN users u_from ON n.from_user_id = u_from.id
LEFT JOIN users u_to ON n.user_id = u_to.id
ORDER BY n.created_at DESC;





