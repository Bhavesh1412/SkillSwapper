const { query, testConnection } = require('./src/models/database');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.log('Database connection failed');
      return;
    }
    
    console.log('Database connected successfully!');
    
    // Check if there are any users
    const users = await query('SELECT id, name, email FROM users LIMIT 5');
    console.log('Users in database:', users.length);
    
    if (users.length > 0) {
      console.log('Sample users:', users);
    }
    
    // Check if there are any matches
    const matches = await query('SELECT COUNT(*) as count FROM matches');
    console.log('Total matches in database:', matches[0].count);
    
    if (matches[0].count > 0) {
      const sampleMatches = await query('SELECT * FROM matches LIMIT 3');
      console.log('Sample matches:', sampleMatches);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testDatabase();

