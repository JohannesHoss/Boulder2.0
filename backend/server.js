const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) UNIQUE NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        member_name VARCHAR(100) NOT NULL,
        weekdays TEXT[] DEFAULT '{}',
        locations TEXT[] DEFAULT '{}',
        week_number VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(member_name, week_number)
      );

      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        week_number VARCHAR(10) UNIQUE NOT NULL,
        winning_day VARCHAR(20),
        winning_location VARCHAR(200),
        participants INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
}

// Seed initial data
async function seedData() {
  const client = await pool.connect();
  try {
    // Check if members exist
    const { rows } = await client.query('SELECT COUNT(*) FROM members');
    if (parseInt(rows[0].count) === 0) {
      const members = ['Arthur', 'Caig', 'David', 'Gustav', 'Johannes', 'Kim', 'Martin', 'Matthias', 'Michelle', 'Raymonds', 'Silvia'];
      for (const name of members) {
        await client.query('INSERT INTO members (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
      }
      console.log('Members seeded');
    }

    // Check if locations exist
    const locResult = await client.query('SELECT COUNT(*) FROM locations');
    if (parseInt(locResult.rows[0].count) === 0) {
      const locations = ['Blockfabrik', 'Boulder Monkeys', 'boulderbar Hannovergasse', 'boulderbar Hauptbahnhof', 'boulderbar Seestadt', 'boulderbar Wienerberg', 'das flash'];
      for (const name of locations) {
        await client.query('INSERT INTO locations (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);
      }
      console.log('Locations seeded');
    }
  } finally {
    client.release();
  }
}

// Helper: Get current week number
function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  const weekNum = Math.ceil((diff + start.getDay() * 86400000) / oneWeek);
  return `${now.getFullYear()}-${weekNum}`;
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get config (members, locations, weekdays)
app.get('/api/config', async (req, res) => {
  try {
    const members = await pool.query('SELECT name FROM members WHERE active = true ORDER BY name');
    const locations = await pool.query('SELECT name FROM locations WHERE active = true ORDER BY name');

    res.json({
      success: true,
      members: members.rows.map(r => r.name),
      locations: locations.rows.map(r => r.name),
      weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get votes for current week
app.get('/api/votes', async (req, res) => {
  try {
    const weekNumber = getCurrentWeekNumber();
    const result = await pool.query(
      'SELECT member_name, weekdays, locations FROM votes WHERE week_number = $1',
      [weekNumber]
    );

    res.json({
      success: true,
      data: result.rows.map(r => ({
        name: r.member_name,
        weekdays: r.weekdays || [],
        locations: r.locations || []
      })),
      weekNumber: parseInt(weekNumber.split('-')[1])
    });
  } catch (error) {
    console.error('Error getting votes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit vote
app.post('/api/vote', async (req, res) => {
  try {
    const { name, weekdays, locations } = req.body;
    const weekNumber = getCurrentWeekNumber();

    await pool.query(`
      INSERT INTO votes (member_name, weekdays, locations, week_number, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (member_name, week_number)
      DO UPDATE SET weekdays = $2, locations = $3, updated_at = NOW()
    `, [name, weekdays, locations, weekNumber]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove vote
app.post('/api/removeVote', async (req, res) => {
  try {
    const { name } = req.body;
    const weekNumber = getCurrentWeekNumber();

    await pool.query(
      'DELETE FROM votes WHERE member_name = $1 AND week_number = $2',
      [name, weekNumber]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leading day/location (for Scriptable widget)
app.get('/api/leading', async (req, res) => {
  try {
    const weekNumber = getCurrentWeekNumber();
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const shortDays = { Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI' };

    // Get current votes
    const result = await pool.query(
      'SELECT member_name, weekdays, locations FROM votes WHERE week_number = $1',
      [weekNumber]
    );
    const votes = result.rows;

    // Count day votes
    const dayCounts = {};
    weekdays.forEach(day => dayCounts[day] = []);
    votes.forEach(v => {
      (v.weekdays || []).forEach(day => {
        if (dayCounts[day]) dayCounts[day].push(v.member_name);
      });
    });

    // Count location votes
    const locCounts = {};
    votes.forEach(v => {
      (v.locations || []).forEach(loc => {
        if (!locCounts[loc]) locCounts[loc] = [];
        locCounts[loc].push(v.member_name);
      });
    });

    // Find leading day(s)
    const maxDayVotes = Math.max(...Object.values(dayCounts).map(v => v.length), 0);
    const leadingDays = Object.entries(dayCounts)
      .filter(([_, voters]) => voters.length === maxDayVotes && voters.length > 0)
      .map(([day, voters]) => ({ day, short: shortDays[day], voters, count: voters.length }));

    // Find leading location(s)
    const maxLocVotes = Math.max(...Object.values(locCounts).map(v => v.length), 0);
    const leadingLocations = Object.entries(locCounts)
      .filter(([_, voters]) => voters.length === maxLocVotes && voters.length > 0)
      .map(([loc, voters]) => ({ location: loc, short: loc.replace(/boulderbar/gi, 'BB'), voters, count: voters.length }));

    // Get dates for this week
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysUntilMonday = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1 - dayOfWeek : (8 - dayOfWeek) % 7 || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysUntilMonday);

    const dates = {};
    weekdays.forEach((day, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates[day] = `${d.getDate()}.${d.getMonth() + 1}.`;
    });

    // Get all voters for leading days
    const allVoters = new Set();
    leadingDays.forEach(d => d.voters.forEach(v => allVoters.add(v)));

    res.json({
      success: true,
      weekNumber: parseInt(weekNumber.split('-')[1]),
      leadingDays: leadingDays.map(d => ({ ...d, date: dates[d.day] })),
      leadingLocations,
      going: Array.from(allVoters),
      compact: leadingDays.length > 0
        ? `🧗 ${leadingDays.map(d => `${d.short} ${dates[d.day]}`).join('/')} 18:30 @ ${leadingLocations.map(l => l.short).join('/')}\n👥 ${Array.from(allVoters).join(', ')}`
        : 'No votes yet'
    });
  } catch (error) {
    console.error('Error getting leading:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    // Top climbers (1 point per week participated)
    const climbers = await pool.query(`
      SELECT member_name as name, COUNT(DISTINCT week_number) as count
      FROM votes
      GROUP BY member_name
      ORDER BY count DESC
    `);

    // Top locations (1 point per week the location was voted for)
    const locationsResult = await pool.query(`
      SELECT name, COUNT(DISTINCT week_number) as count
      FROM (
        SELECT unnest(locations) as name, week_number
        FROM votes
      ) AS location_votes
      GROUP BY name
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        topClimbers: climbers.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
        topLocations: locationsResult.rows.map(r => ({ name: r.name, count: parseInt(r.count) }))
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add member
app.post('/api/addMember', async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('INSERT INTO members (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);

    const members = await pool.query('SELECT name FROM members WHERE active = true ORDER BY name');
    res.json({ success: true, members: members.rows.map(r => r.name) });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove member
app.post('/api/removeMember', async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('DELETE FROM members WHERE name = $1', [name]);
    await pool.query('DELETE FROM votes WHERE member_name = $1', [name]);

    const members = await pool.query('SELECT name FROM members WHERE active = true ORDER BY name');
    res.json({ success: true, members: members.rows.map(r => r.name) });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rename member
app.post('/api/renameMember', async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    await pool.query('UPDATE members SET name = $1 WHERE name = $2', [newName, oldName]);
    await pool.query('UPDATE votes SET member_name = $1 WHERE member_name = $2', [newName, oldName]);

    const members = await pool.query('SELECT name FROM members WHERE active = true ORDER BY name');
    res.json({ success: true, members: members.rows.map(r => r.name) });
  } catch (error) {
    console.error('Error renaming member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add location
app.post('/api/addLocation', async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('INSERT INTO locations (name) VALUES ($1) ON CONFLICT DO NOTHING', [name]);

    const locations = await pool.query('SELECT name FROM locations WHERE active = true ORDER BY name');
    res.json({ success: true, locations: locations.rows.map(r => r.name) });
  } catch (error) {
    console.error('Error adding location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove location
app.post('/api/removeLocation', async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('DELETE FROM locations WHERE name = $1', [name]);

    // Remove location from all votes
    await pool.query(`
      UPDATE votes
      SET locations = array_remove(locations, $1)
    `, [name]);

    const locations = await pool.query('SELECT name FROM locations WHERE active = true ORDER BY name');
    res.json({ success: true, locations: locations.rows.map(r => r.name) });
  } catch (error) {
    console.error('Error removing location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rename location
app.post('/api/renameLocation', async (req, res) => {
  try {
    const { oldName, newName } = req.body;
    await pool.query('UPDATE locations SET name = $1 WHERE name = $2', [newName, oldName]);

    // Update location in all votes
    await pool.query(`
      UPDATE votes
      SET locations = array_replace(locations, $1, $2)
    `, [oldName, newName]);

    const locations = await pool.query('SELECT name FROM locations WHERE active = true ORDER BY name');
    res.json({ success: true, locations: locations.rows.map(r => r.name) });
  } catch (error) {
    console.error('Error renaming location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
async function start() {
  try {
    await initDB();
    await seedData();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
