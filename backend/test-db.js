import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.query("SELECT 1 + 1 AS result");
    console.log("✅ DB Connected! Test query result:", rows[0].result);

    await connection.end();
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
  }
}

testDB();
