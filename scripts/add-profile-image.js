// Migration script to add profile_image column to users table
const postgres = require("postgres");
require("dotenv").config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

async function addProfileImageColumn() {
  try {
    console.log("Adding profile_image column to users table...");
    
    // Add profile_image column if it doesn't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_image TEXT
    `;
    
    console.log("✅ Successfully added profile_image column to users table");
    
    // Check the current structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    console.log("Current users table structure:");
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error("❌ Error adding profile_image column:", error);
  } finally {
    await sql.end();
  }
}

addProfileImageColumn();
