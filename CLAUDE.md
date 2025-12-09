# Boulder 2.0 - AI Agent Guide

## Project Overview

Boulder 2.0 is a mobile-first Progressive Web App (PWA) for a climbing group to vote on weekly meetups. Members can vote for days (Monday-Friday) and locations (various climbing halls in Vienna).

**Live URLs:**
- Frontend: https://boulder20-production.up.railway.app
- Backend API: https://boulder20backend-production.up.railway.app

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla HTML/CSS/JS (PWA) |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Hosting | Railway (Frontend + Backend) |
| Storage | Railway Volume (`/data/boulder.db`) |

## Project Structure

```
Boulder/
├── index.html          # Main HTML (single page app with 3 screens)
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker (network-first caching)
├── package.json        # Frontend dependencies (just serve)
├── css/
│   └── style.css       # All styles (dark theme, WhatsApp-inspired)
├── js/
│   ├── app.js          # Main application logic
│   ├── api.js          # Backend API communication
│   ├── storage.js      # localStorage utilities
│   └── mock.js         # Mock data for offline development
├── icons/
│   ├── icon-192.svg    # App icon (climbing emoji)
│   └── icon-512.svg    # Large app icon
├── backend/
│   ├── server.js       # Express API server (SQLite)
│   └── package.json    # Backend dependencies
└── docs/
    └── Boulder-Widget.js  # iOS Scriptable widget
```

## API Endpoints

Base URL: `https://boulder20backend-production.up.railway.app`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (returns `{status, db}`) |
| GET | `/api/config` | Get members, locations, weekdays |
| GET | `/api/votes` | Get all votes for current week |
| POST | `/api/vote` | Submit vote `{name, weekdays[], locations[]}` |
| POST | `/api/removeVote` | Remove vote `{name}` |
| GET | `/api/leading` | Get leading day/location (for widget) |
| GET | `/api/stats` | Get statistics (top climbers, locations) |
| POST | `/api/addMember` | Add member `{name}` |
| POST | `/api/removeMember` | Remove member `{name}` |
| POST | `/api/renameMember` | Rename `{oldName, newName}` |
| POST | `/api/addLocation` | Add location `{name}` |
| POST | `/api/removeLocation` | Remove location `{name}` |
| POST | `/api/renameLocation` | Rename `{oldName, newName}` |

## Database Schema (SQLite)

```sql
-- Members table
CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Votes table (weekdays/locations stored as JSON arrays)
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_name TEXT NOT NULL,
  weekdays TEXT DEFAULT '[]',      -- JSON array: ["Monday", "Wednesday"]
  locations TEXT DEFAULT '[]',      -- JSON array: ["Blockfabrik", "das flash"]
  week_number TEXT NOT NULL,        -- Format: "2025-50"
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_name, week_number)
);
```

## Key Features

1. **Vote System**: Each member can vote for multiple days and locations per week
2. **Leading Display**: Shows current leader(s) with vote count and voters
3. **Share Function**: Share leading info via Web Share API or clipboard
4. **Stats**: Track participation (1 point per week, not per vote)
5. **Settings**: Add/remove/rename members and locations
6. **Scriptable Widget**: iOS home screen widget showing current leader
7. **Weekly Reset**: Votes reset each week (tracked by week number)

## Development

### Local Frontend
```bash
cd Boulder
npm run dev          # Serves on localhost:3000
# or
npx serve -s . -l 8080
```

### Local Backend
```bash
cd Boulder/backend
npm install
npm run dev          # Runs on localhost:3001
```

For local development, update `js/api.js`:
```javascript
BASE_URL: 'http://localhost:3001'
```

## Deployment (Railway)

### Frontend Service: "Boulder2.0"
- Root directory: `/` (project root)
- Start command: `npx serve -s . -l $PORT`

### Backend Service: "Boulder20_backend"
- Root directory: `/backend`
- Start command: `node server.js`
- Environment variable: `DATABASE_PATH=/data/boulder.db`
- Volume mounted at: `/data`

### Deploy Commands
```bash
# Deploy backend
cd backend
railway link -p 30648eb8-a3fa-4f0a-9017-fbdad1c2f44b -s 59c2afd2-8537-4724-9f84-3fcdfb12ce23
railway up

# Deploy frontend
cd ..
railway link -p 30648eb8-a3fa-4f0a-9017-fbdad1c2f44b -s 47febc48-9c36-4f2a-9e21-67c09ac38d18
railway up
```

## Important Code Sections

### Vote Submission (app.js)
- `submitVote()`: Sends vote to backend, updates local state
- `updateLocalVote()`: Immediately updates UI before server response
- `updateFavoritesSummary()`: Calculates and displays leading day/location

### Share Function (app.js)
- `shareLeading()`: Creates compact message and shares via Web Share API
- Format: `🧗 WED 11.12. 18:30 @ BB Hannovergasse\n👥 Kim, Arthur`

### Service Worker (sw.js)
- Network-first strategy for fresh content
- Cache version: `boulder-v2`
- Skips caching for API requests

### Scriptable Widget (docs/Boulder-Widget.js)
- Fetches `/api/leading` endpoint
- Displays in iOS home screen widget
- Cache-busting with timestamp parameter

## Common Tasks

### Add a new API endpoint
1. Edit `backend/server.js`
2. Add route handler
3. Deploy: `railway up`

### Change UI styling
1. Edit `css/style.css`
2. Test locally: `npx serve -s . -l 8080`
3. Deploy: `railway up`

### Update frontend logic
1. Edit `js/app.js`
2. Increment service worker cache version in `sw.js` if needed
3. Deploy: `railway up`

## Git Branches

- `main`: Current SQLite version (production)
- `pre`: Previous PostgreSQL version (backup)

## Notes

- Week numbers follow ISO format: `YYYY-WW`
- All times displayed as "18:30 Uhr" (German format)
- "boulderbar" is shortened to "BB" in displays
- Stats count 1 point per week participated (not per vote)
