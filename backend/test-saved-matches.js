const { Match, User, query } = require('./src/models/database');

async function testSavedMatches() {
  try {
    console.log('Testing saved matches...');
    
    // Get a user ID to test with
    const users = await query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }
    
    const userId = users[0].id;
    console.log('Testing with user ID:', userId);
    
    // Test the saved matches query
    const sql = `
      SELECT m.*, 
             u1.name as user1_name, u1.profile_pic as user1_pic,
             u2.name as user2_name, u2.profile_pic as user2_pic
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE m.user1_id = ? OR m.user2_id = ?
      ORDER BY m.updated_at DESC LIMIT 20 OFFSET 0
    `;
    
    const savedMatches = await query(sql, [userId, userId]);
    console.log('Found matches:', savedMatches.length);
    
    if (savedMatches.length > 0) {
      console.log('Sample match:', JSON.stringify(savedMatches[0], null, 2));
    }
    
    // Check if there are any matches at all
    const allMatches = await query('SELECT COUNT(*) as count FROM matches');
    console.log('Total matches in database:', allMatches[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testSavedMatches();

