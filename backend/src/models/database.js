// MySQL database connection and query utilities

const mysql = require("mysql2/promise");

// Created a connection pool for connection management here
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "skillswapper",
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Security and performance settings
    // acquireTimeout: 60000,
    // timeout: 60000,
    // reconnect: true,
    // SSL settings for production..
    ssl:
        process.env.NODE_ENV === "production"
            ? {
                rejectUnauthorized: false,
            }
            : false,
});

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Database connected successfully");
        connection.release();
        return true;
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        return false;
    }
};

// Utility function for safe database queries
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error("Database query error:", error.message);
        throw new Error("Database operation failed");
    }
};

// User model with all CRUD operations

const User = {
    // Create new user
    async create(userData) {
        const { name, email, password_hash, bio, location } = userData;
        const sql = `
            INSERT INTO users (name, email, password_hash, bio, location) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await query(sql, [
            name,
            email,
            password_hash,
            bio || null,
            location || null,
        ]);
        return result.insertId;
    },

    // Find user by email (for authentication)
    async findByEmail(email) {
        const sql = "SELECT * FROM users WHERE email = ?";
        const users = await query(sql, [email]);
        return users[0] || null;
    },

    // Find user by ID
    async findById(id) {
        const sql =
            "SELECT id, name, email, bio, location, profile_pic, created_at FROM users WHERE id = ?";
        const users = await query(sql, [id]);
        return users[0] || null;
    },

    // Update user profile
    async update(id, updates) {
        const allowedFields = ["name", "bio", "location", "profile_pic"];
        const updateFields = [];
        const values = [];

        Object.keys(updates).forEach((key) => {
            if (allowedFields.includes(key) && updates[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (updateFields.length === 0) {
            throw new Error("No valid fields to update");
        }

        values.push(id);
        const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;

        await query(sql, values);
        return this.findById(id);
    },

    // Get user with their skills
    async getWithSkills(id) {
        const user = await this.findById(id);
        if (!user) return null;

        // Get skills they have
        const skillsHaveQuery = `
            SELECT s.id, s.skill_name, ush.proficiency_level
            FROM user_skills_have ush
            JOIN skills s ON ush.skill_id = s.id
            WHERE ush.user_id = ?
        `;
        const skillsHave = await query(skillsHaveQuery, [id]);

        // Get skills they want
        const skillsWantQuery = `
            SELECT s.id, s.skill_name, usw.urgency_level
            FROM user_skills_want usw
            JOIN skills s ON usw.skill_id = s.id
            WHERE usw.user_id = ?
        `;
        const skillsWant = await query(skillsWantQuery, [id]);

        return {
            ...user,
            skills_have: skillsHave,
            skills_want: skillsWant,
        };
    },
};

// SKILLS MODEL .......
const Skill = {
    // All skills Get
    async getAll() {
        const sql = "SELECT * FROM skills ORDER BY skill_name";
        return await query(sql);
    },

    // Find or create skill
    async findOrCreate(skillName) {
        const normalizedName = skillName.trim().toLowerCase();

        // Try to find existing skill (with implementing case insesnitivity
        let sql = "SELECT * FROM skills WHERE LOWER(skill_name) = ?";
        let skills = await query(sql, [normalizedName]);

        if (skills.length > 0) {
            return skills[0];
        }

        // Createing new skill
        sql = "INSERT INTO skills (skill_name) VALUES (?)";
        const result = await query(sql, [skillName]);

        return {
            id: result.insertId,
            skill_name: skillName,
        };
    },

    // Add skill to user's "have" list
    async addToUserHave(userId, skillId, proficiencyLevel = "intermediate") {
        const sql = `
            INSERT INTO user_skills_have (user_id, skill_id, proficiency_level) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level)
        `;
        await query(sql, [userId, skillId, proficiencyLevel]);
    },

    // Add skill to user's "want" list
    async addToUserWant(userId, skillId, urgencyLevel = "medium") {
        const sql = `
            INSERT INTO user_skills_want (user_id, skill_id, urgency_level) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE urgency_level = VALUES(urgency_level)
        `;
        await query(sql, [userId, skillId, urgencyLevel]);
    },

    // Remove skill from user's "have" list
    async removeFromUserHave(userId, skillId) {
        const sql =
            "DELETE FROM user_skills_have WHERE user_id = ? AND skill_id = ?";
        await query(sql, [userId, skillId]);
    },

    // Remove skill from user's "want" list
    async removeFromUserWant(userId, skillId) {
        const sql =
            "DELETE FROM user_skills_want WHERE user_id = ? AND skill_id = ?";
        await query(sql, [userId, skillId]);
    },
};

// Matching for finding users
//MAtch type done here is reciprocal mattching

const Match = {
    async findMatches(userId) {
        const sql = `
            SELECT DISTINCT 
                u.id,
                u.name,
                u.bio,
                u.location,
                u.profile_pic,
                GROUP_CONCAT(DISTINCT s_common_have.skill_name) as matching_skills_i_have,
                GROUP_CONCAT(DISTINCT s_common_want.skill_name) as matching_skills_i_want
            FROM users u
        
            JOIN user_skills_want usw ON u.id = usw.user_id
            JOIN user_skills_have ush_current ON usw.skill_id = ush_current.skill_id AND ush_current.user_id = ?
            JOIN skills s_common_have ON ush_current.skill_id = s_common_have.id
            
            JOIN user_skills_have ush ON u.id = ush.user_id
            JOIN user_skills_want usw_current ON ush.skill_id = usw_current.skill_id AND usw_current.user_id = ?
            JOIN skills s_common_want ON ush.skill_id = s_common_want.id
            WHERE u.id != ?
            GROUP BY u.id
            ORDER BY COUNT(DISTINCT s_common_have.id) + COUNT(DISTINCT s_common_want.id) DESC
            LIMIT 20
        `;

        return await query(sql, [userId, userId, userId]);
    },

    // Save a potential match
    async create(user1Id, user2Id, matchedSkills) {
        const sql = `
            INSERT INTO matches (user1_id, user2_id, matched_skills, status) 
            VALUES (?, ?, ?, 'pending')
            ON DUPLICATE KEY UPDATE 
                matched_skills = VALUES(matched_skills),
                updated_at = CURRENT_TIMESTAMP
        `;

        await query(sql, [user1Id, user2Id, JSON.stringify(matchedSkills)]);
    },

    // Accept a pending match between two users (in any direction)
    async accept(userAId, userBId) {
        const sql = `
            UPDATE matches
            SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
            WHERE status = 'pending' AND (
                (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
            )
        `;
        const result = await query(sql, [userAId, userBId, userBId, userAId]);
        return result.affectedRows > 0;
    },

    // Decline a pending match between two users (in any direction)
    async decline(userAId, userBId) {
        const sql = `
            UPDATE matches
            SET status = 'declined', updated_at = CURRENT_TIMESTAMP
            WHERE status = 'pending' AND (
                (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
            )
        `;
        const result = await query(sql, [userAId, userBId, userBId, userAId]);
        return result.affectedRows > 0;
    },

    // Check if two users have an accepted connection
    async areConnected(userAId, userBId) {
        const sql = `
            SELECT id FROM matches
            WHERE status = 'accepted' AND (
                (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
            )
            LIMIT 1
        `;
        const rows = await query(sql, [userAId, userBId, userBId, userAId]);
        return rows.length > 0;
    },
};

// Document model
const Document = {
    // Save document info
    async create(userId, fileInfo) {
        const { file_name, file_path, file_type, file_size, skill_id } = fileInfo;
        const sql = `
            INSERT INTO documents (user_id, file_name, file_path, file_type, file_size, skill_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const result = await query(sql, [
            userId,
            file_name,
            file_path,
            file_type,
            file_size,
            skill_id || null,
        ]);
        return result.insertId;
    },

    // Get user's documents
    async getByUserId(userId) {
        const sql = `
            SELECT d.*, s.skill_name 
            FROM documents d 
            LEFT JOIN skills s ON d.skill_id = s.id 
            WHERE d.user_id = ? 
            ORDER BY d.uploaded_at DESC
        `;

        return await query(sql, [userId]);
    },
};

// Notification model
const Notification = {
    // Create a new notification
    async create(notificationData) {
        const { user_id, from_user_id, type, title, message, data } = notificationData;
        const sql = `
            INSERT INTO notifications (user_id, from_user_id, type, title, message, data) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const result = await query(sql, [
            user_id,
            from_user_id || null,
            type,
            title,
            message,
            data ? JSON.stringify(data) : null,
        ]);
        return result.insertId;
    },

    // Get user's notifications
    async getByUserId(userId, options = {}) {
        const { limit = 20, offset = 0, unreadOnly = false } = options;
        
        let sql = `
            SELECT n.*, u.name as from_user_name, u.profile_pic as from_user_pic
            FROM notifications n
            LEFT JOIN users u ON n.from_user_id = u.id
            WHERE n.user_id = ?
        `;
        
        const params = [userId];
        
        if (unreadOnly) {
            sql += ' AND n.is_read = FALSE';
        }
        
        sql += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        return await query(sql, params);
    },

    // Get unread notification count
    async getUnreadCount(userId) {
        const sql = `
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE user_id = ? AND is_read = FALSE
        `;
        
        const result = await query(sql, [userId]);
        return result[0].count;
    },

    // Mark notification as read
    async markAsRead(notificationId, userId) {
        const sql = `
            UPDATE notifications 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?
        `;
        
        await query(sql, [notificationId, userId]);
    },

    // Mark all notifications as read for a user
    async markAllAsRead(userId) {
        const sql = `
            UPDATE notifications 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
            WHERE user_id = ? AND is_read = FALSE
        `;
        
        await query(sql, [userId]);
    },

    // Delete notification
    async delete(notificationId, userId) {
        const sql = `
            DELETE FROM notifications 
            WHERE id = ? AND user_id = ?
        `;
        
        await query(sql, [notificationId, userId]);
    },
};

// Initialize database connection
testConnection();

module.exports = {
    pool,
    query,
    testConnection,
    User,
    Skill,
    Match,
    Document,
    Notification,
};
