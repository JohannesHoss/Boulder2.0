const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// SQLite database path - use /data for Railway volume, fallback to local
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'boulder.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_name TEXT NOT NULL,
      weekdays TEXT DEFAULT '[]',
      locations TEXT DEFAULT '[]',
      week_number TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(member_name, week_number)
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_number TEXT UNIQUE NOT NULL,
      winning_day TEXT,
      winning_location TEXT,
      participants INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database tables initialized');
}

// Seed initial data
function seedData() {
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get();
  if (memberCount.count === 0) {
    const members = ['Arthur', 'Craig', 'David', 'Gustav', 'Johannes', 'Kim', 'Martin', 'Matthias', 'Michelle', 'Raymonds', 'Silvia'];
    const insertMember = db.prepare('INSERT OR IGNORE INTO members (name) VALUES (?)');
    for (const name of members) {
      insertMember.run(name);
    }
    console.log('Members seeded');
  }

  const locCount = db.prepare('SELECT COUNT(*) as count FROM locations').get();
  if (locCount.count === 0) {
    const locations = ['Blockfabrik', 'Boulder Monkeys', 'boulderbar Hannovergasse', 'boulderbar Hauptbahnhof', 'boulderbar Seestadt', 'boulderbar Wienerberg', 'das flash'];
    const insertLoc = db.prepare('INSERT OR IGNORE INTO locations (name) VALUES (?)');
    for (const name of locations) {
      insertLoc.run(name);
    }
    console.log('Locations seeded');
  }
}

// Helper: Get voting week number (changes Friday 20:00)
// Votes from Fr 20:00 to next Fr 20:00 belong to the same voting period
function getCurrentWeekNumber() {
  const now = new Date();

  // If before Friday 20:00, use current week; after Friday 20:00, use next week
  const adjustedDate = new Date(now);
  const day = now.getDay(); // 0=Sun, 5=Fri
  const hour = now.getHours();

  // After Friday 20:00 or on Sat/Sun, we're voting for NEXT week
  if ((day === 5 && hour >= 20) || day === 6 || day === 0) {
    // Move to next Monday to get correct week number
    const daysUntilMonday = day === 0 ? 1 : (8 - day);
    adjustedDate.setDate(now.getDate() + daysUntilMonday);
  }

  // Calculate ISO week number for the adjusted date
  const thursday = new Date(adjustedDate);
  thursday.setDate(adjustedDate.getDate() - ((adjustedDate.getDay() + 6) % 7) + 3);

  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

  const weekNum = Math.round((thursday - firstThursday) / 604800000) + 1;
  return `${thursday.getFullYear()}-${weekNum}`;
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: 'sqlite' });
});

// Get config (members, locations, weekdays)
app.get('/api/config', (req, res) => {
  try {
    const members = db.prepare('SELECT name FROM members WHERE active = 1 ORDER BY name').all();
    const locations = db.prepare('SELECT name FROM locations WHERE active = 1 ORDER BY name').all();

    res.json({
      success: true,
      members: members.map(r => r.name),
      locations: locations.map(r => r.name),
      weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get votes for current week or specific week
app.get('/api/votes', (req, res) => {
  try {
    const currentWeek = getCurrentWeekNumber();
    // Allow fetching specific week via query param: /api/votes?week=2025-50
    const weekNumber = req.query.week || currentWeek;
    const votes = db.prepare('SELECT member_name, weekdays, locations FROM votes WHERE week_number = ?').all(weekNumber);

    res.json({
      success: true,
      data: votes.map(r => ({
        name: r.member_name,
        weekdays: JSON.parse(r.weekdays || '[]'),
        locations: JSON.parse(r.locations || '[]')
      })),
      weekNumber: parseInt(weekNumber.split('-')[1]),
      year: parseInt(weekNumber.split('-')[0]),
      isCurrentWeek: weekNumber === currentWeek,
      currentWeekNumber: currentWeek
    });
  } catch (error) {
    console.error('Error getting votes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get list of weeks that have votes (for navigation)
app.get('/api/weeks', (req, res) => {
  try {
    const weeks = db.prepare('SELECT DISTINCT week_number FROM votes ORDER BY week_number DESC').all();
    const currentWeek = getCurrentWeekNumber();

    res.json({
      success: true,
      weeks: weeks.map(w => w.week_number),
      currentWeek
    });
  } catch (error) {
    console.error('Error getting weeks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit vote
app.post('/api/vote', (req, res) => {
  try {
    const { name, weekdays, locations, week } = req.body;
    // Use provided week or default to current week
    const weekNumber = week || getCurrentWeekNumber();

    const stmt = db.prepare(`
      INSERT INTO votes (member_name, weekdays, locations, week_number, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(member_name, week_number)
      DO UPDATE SET weekdays = ?, locations = ?, updated_at = datetime('now')
    `);

    const weekdaysJson = JSON.stringify(weekdays || []);
    const locationsJson = JSON.stringify(locations || []);
    stmt.run(name, weekdaysJson, locationsJson, weekNumber, weekdaysJson, locationsJson);

    res.json({ success: true });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove vote
app.post('/api/removeVote', (req, res) => {
  try {
    const { name, week } = req.body;
    // Use provided week or default to current week
    const weekNumber = week || getCurrentWeekNumber();

    db.prepare('DELETE FROM votes WHERE member_name = ? AND week_number = ?').run(name, weekNumber);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leading day/location (for Scriptable widget)
app.get('/api/leading', (req, res) => {
  try {
    const weekNumber = getCurrentWeekNumber();
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const shortDays = { Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI' };

    // Get current votes
    const votesRaw = db.prepare('SELECT member_name, weekdays, locations FROM votes WHERE week_number = ?').all(weekNumber);
    const votes = votesRaw.map(v => ({
      member_name: v.member_name,
      weekdays: JSON.parse(v.weekdays || '[]'),
      locations: JSON.parse(v.locations || '[]')
    }));

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
      .map(([loc, voters]) => ({ location: loc, short: loc, voters, count: voters.length }));

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

// Get statistics (points only if picked winning day/location)
// Stats are only calculated for completed weeks (after Friday 20:00)
app.get('/api/stats', (req, res) => {
  try {
    // Get current voting week (excludes it from stats since voting is still open)
    const currentWeek = getCurrentWeekNumber();

    // Get all votes EXCEPT current week (only finalized weeks count)
    const allVotes = db.prepare('SELECT member_name, weekdays, locations, week_number FROM votes WHERE week_number != ?').all(currentWeek);

    // Group votes by week
    const votesByWeek = {};
    allVotes.forEach(vote => {
      if (!votesByWeek[vote.week_number]) votesByWeek[vote.week_number] = [];
      votesByWeek[vote.week_number].push({
        name: vote.member_name,
        weekdays: JSON.parse(vote.weekdays || '[]'),
        locations: JSON.parse(vote.locations || '[]')
      });
    });

    const climberPoints = {};
    const locationPoints = {};

    // For each week, find winners and award points
    Object.entries(votesByWeek).forEach(([weekNumber, votes]) => {
      // Count day votes
      const dayCounts = {};
      votes.forEach(v => {
        v.weekdays.forEach(day => {
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
      });

      // Find winning day(s) - highest vote count
      const maxDayVotes = Math.max(...Object.values(dayCounts), 0);
      const winningDays = Object.entries(dayCounts)
        .filter(([_, count]) => count === maxDayVotes && count > 0)
        .map(([day]) => day);

      // Award points to climbers who picked a winning day
      votes.forEach(v => {
        const pickedWinningDay = v.weekdays.some(day => winningDays.includes(day));
        if (pickedWinningDay) {
          climberPoints[v.name] = (climberPoints[v.name] || 0) + 1;
        }
      });

      // Only count location votes from people who picked the winning day
      const validVoters = votes.filter(v =>
        v.weekdays.some(day => winningDays.includes(day))
      );

      // Count locations only from valid voters
      const locCounts = {};
      validVoters.forEach(v => {
        v.locations.forEach(loc => {
          locCounts[loc] = (locCounts[loc] || 0) + 1;
        });
      });

      // Find winning location(s) from valid votes only
      const maxLocVotes = Math.max(...Object.values(locCounts), 0);
      const winningLocs = Object.entries(locCounts)
        .filter(([_, count]) => count === maxLocVotes && count > 0)
        .map(([loc]) => loc);

      // Award points to winning locations
      winningLocs.forEach(loc => {
        locationPoints[loc] = (locationPoints[loc] || 0) + 1;
      });
    });

    // Sort and format results
    const topClimbers = Object.entries(climberPoints)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topLocations = Object.entries(locationPoints)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: { topClimbers, topLocations }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add member
app.post('/api/addMember', (req, res) => {
  try {
    const { name } = req.body;
    db.prepare('INSERT OR IGNORE INTO members (name) VALUES (?)').run(name);

    const members = db.prepare('SELECT name FROM members WHERE active = 1 ORDER BY name').all();
    res.json({ success: true, members: members.map(r => r.name) });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove member
app.post('/api/removeMember', (req, res) => {
  try {
    const { name } = req.body;
    db.prepare('DELETE FROM members WHERE name = ?').run(name);
    db.prepare('DELETE FROM votes WHERE member_name = ?').run(name);

    const members = db.prepare('SELECT name FROM members WHERE active = 1 ORDER BY name').all();
    res.json({ success: true, members: members.map(r => r.name) });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rename member
app.post('/api/renameMember', (req, res) => {
  try {
    const { oldName, newName } = req.body;
    db.prepare('UPDATE members SET name = ? WHERE name = ?').run(newName, oldName);
    db.prepare('UPDATE votes SET member_name = ? WHERE member_name = ?').run(newName, oldName);

    const members = db.prepare('SELECT name FROM members WHERE active = 1 ORDER BY name').all();
    res.json({ success: true, members: members.map(r => r.name) });
  } catch (error) {
    console.error('Error renaming member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add location
app.post('/api/addLocation', (req, res) => {
  try {
    const { name } = req.body;
    db.prepare('INSERT OR IGNORE INTO locations (name) VALUES (?)').run(name);

    const locations = db.prepare('SELECT name FROM locations WHERE active = 1 ORDER BY name').all();
    res.json({ success: true, locations: locations.map(r => r.name) });
  } catch (error) {
    console.error('Error adding location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove location
app.post('/api/removeLocation', (req, res) => {
  try {
    const { name } = req.body;
    db.prepare('DELETE FROM locations WHERE name = ?').run(name);

    // Remove location from all votes (update JSON arrays)
    const allVotes = db.prepare('SELECT id, locations FROM votes').all();
    const updateStmt = db.prepare('UPDATE votes SET locations = ? WHERE id = ?');

    allVotes.forEach(vote => {
      const locs = JSON.parse(vote.locations || '[]');
      const newLocs = locs.filter(l => l !== name);
      if (locs.length !== newLocs.length) {
        updateStmt.run(JSON.stringify(newLocs), vote.id);
      }
    });

    const locations = db.prepare('SELECT name FROM locations WHERE active = 1 ORDER BY name').all();
    res.json({ success: true, locations: locations.map(r => r.name) });
  } catch (error) {
    console.error('Error removing location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rename location
app.post('/api/renameLocation', (req, res) => {
  try {
    const { oldName, newName } = req.body;
    db.prepare('UPDATE locations SET name = ? WHERE name = ?').run(newName, oldName);

    // Update location in all votes (update JSON arrays)
    const allVotes = db.prepare('SELECT id, locations FROM votes').all();
    const updateStmt = db.prepare('UPDATE votes SET locations = ? WHERE id = ?');

    allVotes.forEach(vote => {
      const locs = JSON.parse(vote.locations || '[]');
      const newLocs = locs.map(l => l === oldName ? newName : l);
      if (JSON.stringify(locs) !== JSON.stringify(newLocs)) {
        updateStmt.run(JSON.stringify(newLocs), vote.id);
      }
    });

    const locations = db.prepare('SELECT name FROM locations WHERE active = 1 ORDER BY name').all();
    res.json({ success: true, locations: locations.map(r => r.name) });
  } catch (error) {
    console.error('Error renaming location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
function start() {
  try {
    initDB();
    seedData();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: ${DB_PATH}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
