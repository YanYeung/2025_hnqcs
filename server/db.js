
const { createPool } = require('@vercel/postgres');

// Create connection pool
// This requires POSTGRES_URL environment variable to be set (automatic in Vercel)
const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
});

let isInitialized = false;

// Initialize tables (Postgres syntax)
async function initDB() {
  if (isInitialized) return;

  const client = await pool.connect();
  try {
    // Meta Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY, 
        value TEXT
      );
    `;
    
    // Sub Events
    await client.sql`
      CREATE TABLE IF NOT EXISTS sub_events (
        id TEXT PRIMARY KEY, 
        name TEXT
      );
    `;

    // Referees
    await client.sql`
      CREATE TABLE IF NOT EXISTS referees (
        id TEXT PRIMARY KEY, 
        username TEXT, 
        password TEXT, 
        sub_event_id TEXT
      );
    `;

    // Entries
    await client.sql`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY, 
        participant_id TEXT, 
        participant_name TEXT, 
        group_type TEXT, 
        round TEXT, 
        score REAL, 
        time REAL, 
        timestamp BIGINT, 
        sub_event_id TEXT
      );
    `;

    // Roster (Composite Key)
    await client.sql`
      CREATE TABLE IF NOT EXISTS roster (
        id TEXT, 
        name TEXT, 
        group_type TEXT, 
        sub_event_id TEXT,
        PRIMARY KEY (id, sub_event_id)
      );
    `;

    // Seed Data (Check if exists first)
    const nameCheck = await client.sql`SELECT value FROM meta WHERE key = 'competition_name'`;
    if (nameCheck.rowCount === 0) {
      await client.sql`INSERT INTO meta (key, value) VALUES ('competition_name', '2025年湖南省青少年创新实践大赛')`;
    }

    const passCheck = await client.sql`SELECT value FROM meta WHERE key = 'admin_password'`;
    if (passCheck.rowCount === 0) {
      await client.sql`INSERT INTO meta (key, value) VALUES ('admin_password', 'admin')`;
    }

    const awardCheck = await client.sql`SELECT value FROM meta WHERE key = 'award_config'`;
    if (awardCheck.rowCount === 0) {
      await client.sql`INSERT INTO meta (key, value) VALUES ('award_config', ${JSON.stringify({first:15, second:25, third:30})})`;
    }
    
    isInitialized = true;
    console.log("Database initialized");
  } catch (err) {
    console.error("DB Init Error:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Wrapper to ensure DB is initialized before query
async function query(text, params) {
  if (!isInitialized) await initDB();
  return pool.query(text, params);
}

module.exports = {
  query,
  pool
};
