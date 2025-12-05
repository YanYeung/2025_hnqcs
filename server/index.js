
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- HELPER FOR ASYNC ROUTES ---
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- API ROUTES ---

// Auth
app.post('/api/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin') {
    const result = await db.query("SELECT value FROM meta WHERE key = $1", ['admin_password']);
    if (result.rows.length > 0 && result.rows[0].value === password) {
      res.json({ user: { role: 'admin', username: 'admin' }, token: 'mock-admin-token' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } else {
    const result = await db.query("SELECT * FROM referees WHERE username = $1 AND password = $2", [username, password]);
    if (result.rows.length > 0) {
      const row = result.rows[0];
      res.json({ user: { role: 'referee', username: row.username, assignedEventId: row.sub_event_id }, token: 'mock-ref-token' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
}));

app.post('/api/admin/password', asyncHandler(async (req, res) => {
  const { password } = req.body;
  await db.query("UPDATE meta SET value = $1 WHERE key = 'admin_password'", [password]);
  res.sendStatus(200);
}));

// Info
app.get('/api/info', asyncHandler(async (req, res) => {
  const result = await db.query("SELECT * FROM meta");
  const data = {};
  result.rows.forEach(r => data[r.key] = r.value);
  
  // Safe parsing
  let awardConfig = {first:15, second:25, third:30};
  try {
    if (data.award_config) awardConfig = JSON.parse(data.award_config);
  } catch (e) {}

  res.json({
    name: data.competition_name || '未命名赛事',
    awardConfig
  });
}));

app.post('/api/info', asyncHandler(async (req, res) => {
  const { name, config } = req.body;
  // Postgres doesn't allow multiple statements in one query easily via pool, do sequentially or transaction
  await db.query("UPDATE meta SET value = $1 WHERE key = 'competition_name'", [name]);
  await db.query("UPDATE meta SET value = $1 WHERE key = 'award_config'", [JSON.stringify(config)]);
  res.sendStatus(200);
}));

// Events
app.get('/api/events', asyncHandler(async (req, res) => {
  const result = await db.query("SELECT * FROM sub_events");
  res.json(result.rows);
}));

app.post('/api/events', asyncHandler(async (req, res) => {
  const { name } = req.body;
  const id = crypto.randomUUID();
  await db.query("INSERT INTO sub_events (id, name) VALUES ($1, $2)", [id, name]);
  res.json({ id, name });
}));

app.put('/api/events/:id', asyncHandler(async (req, res) => {
  await db.query("UPDATE sub_events SET name = $1 WHERE id = $2", [req.body.name, req.params.id]);
  res.sendStatus(200);
}));

app.delete('/api/events/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  // In real PG, use CASCADE constraints or a transaction. Here we run sequentially.
  await db.query("DELETE FROM entries WHERE sub_event_id = $1", [id]);
  await db.query("DELETE FROM roster WHERE sub_event_id = $1", [id]);
  await db.query("DELETE FROM referees WHERE sub_event_id = $1", [id]);
  await db.query("DELETE FROM sub_events WHERE id = $1", [id]);
  res.sendStatus(200);
}));

// Referees
app.get('/api/referees', asyncHandler(async (req, res) => {
  const result = await db.query("SELECT id, username, password, sub_event_id as \"subEventId\" FROM referees");
  res.json(result.rows);
}));

app.post('/api/referees', asyncHandler(async (req, res) => {
  const { username, password, subEventId } = req.body;
  const id = crypto.randomUUID();
  await db.query("INSERT INTO referees (id, username, password, sub_event_id) VALUES ($1, $2, $3, $4)", 
    [id, username, password, subEventId]);
  res.json({ id, username, password, subEventId });
}));

app.delete('/api/referees/:id', asyncHandler(async (req, res) => {
  await db.query("DELETE FROM referees WHERE id = $1", [req.params.id]);
  res.sendStatus(200);
}));

// Entries
app.get('/api/entries', asyncHandler(async (req, res) => {
  let sql = "SELECT id, participant_id as \"participantId\", participant_name as \"participantName\", group_type as \"group\", round, score, time, timestamp, sub_event_id as \"subEventId\" FROM entries";
  let params = [];
  if (req.query.subEventId) {
    sql += " WHERE sub_event_id = $1";
    params.push(req.query.subEventId);
  }
  const result = await db.query(sql, params);
  // Ensure numeric types are numbers (PG driver might return strings for BIGINT sometimes)
  const rows = result.rows.map(r => ({
    ...r,
    score: Number(r.score),
    time: Number(r.time),
    timestamp: Number(r.timestamp)
  }));
  res.json(rows);
}));

app.post('/api/entries', asyncHandler(async (req, res) => {
  const e = req.body;
  const id = e.id || crypto.randomUUID();
  await db.query(`INSERT INTO entries (id, participant_id, participant_name, group_type, round, score, time, timestamp, sub_event_id) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, e.participantId, e.participantName, e.group, e.round, e.score, e.time, e.timestamp, e.subEventId]);
  res.json({ ...e, id });
}));

app.put('/api/entries/:id', asyncHandler(async (req, res) => {
  const e = req.body;
  await db.query(`UPDATE entries SET participant_id=$1, participant_name=$2, group_type=$3, round=$4, score=$5, time=$6 WHERE id=$7`,
    [e.participantId, e.participantName, e.group, e.round, e.score, e.time, req.params.id]);
  res.sendStatus(200);
}));

app.delete('/api/entries/:id', asyncHandler(async (req, res) => {
  await db.query("DELETE FROM entries WHERE id = $1", [req.params.id]);
  res.sendStatus(200);
}));

// Roster
app.get('/api/roster', asyncHandler(async (req, res) => {
  let sql = "SELECT id, name, group_type as \"group\", sub_event_id as \"subEventId\" FROM roster";
  let params = [];
  if (req.query.subEventId) {
    sql += " WHERE sub_event_id = $1";
    params.push(req.query.subEventId);
  }
  const result = await db.query(sql, params);
  res.json(result.rows);
}));

app.post('/api/roster/batch', asyncHandler(async (req, res) => {
  const { items } = req.body; // Array of items
  
  // Postgres "Upsert" using ON CONFLICT
  // Since we can't easily loop async in a single statement without building a huge string,
  // we'll loop sequentially or use Promise.all. For safety/simplicity in this demo:
  for (const item of items) {
    await db.query(`
      INSERT INTO roster (id, name, group_type, sub_event_id) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id, sub_event_id) 
      DO UPDATE SET name = EXCLUDED.name, group_type = EXCLUDED.group_type
    `, [item.id, item.name, item.group, item.subEventId]);
  }
  
  res.sendStatus(200);
}));

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// For Vercel: Export the app
module.exports = app;

// For Local: Listen if not running in Vercel (optional, but Vercel handles start)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}
