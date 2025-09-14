const { User, testConnection } = require("./src/models/database");

(async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.log("❌ Could not connect to DB");
      return;
    }

    // Insert test user
    const newUserId = await User.create({
      name: "Test User",
      email: "testuser@example.com",
      password_hash: "hashedpassword123",
      bio: "This is just a test user",
      location: "Test City",
    });

    console.log("✅ User inserted with ID:", newUserId);

    // Fetch the same user
    const fetchedUser = await User.findById(newUserId);
    console.log("📦 Retrieved User:", fetchedUser);

  } catch (err) {
    console.error("❌ Test failed:", err.message);
  } finally {
    process.exit();
  }
})();
