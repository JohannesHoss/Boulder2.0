# Boulder 2.0 - AI Agent Guide

## Global Rules
@~/.claude/CLAUDE.md

## Project Overview

Boulder 2.0 is a mobile-first Progressive Web App (PWA) for a climbing group to vote on weekly meetups. Members can vote for days (Monday-Friday) and locations (various climbing halls in Vienna).

**Live URLs:**
- Frontend: https://boulder.varga.media (Edge Stack)
- Backend API: https://boulder-api.varga.media (Edge Stack)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla HTML/CSS/JS (PWA) |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Deployment | Docker (nginx + node), Traefik via Edge Stack |
| Storage | Docker Volume (`boulder-data`) |

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
├── docs/
│   └── Boulder-Widget.js  # iOS Scriptable widget
└── 00_infos/
    └── llm-context.md  # Project context
```

## API Endpoints

Base URL: `https://boulder-api.varga.media`

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
npm run dev          # Serves on localhost:3000
# or
npx serve -s . -l 8080
```

### Local Backend
```bash
cd backend
npm install
npm run dev          # Runs on localhost:3001
```

For local development, update `js/api.js`:
```javascript
BASE_URL: 'http://localhost:3001'
```

## Deployment (Edge Stack)

Deployment uses central CI/CD via `0000__infra-multi__ci-cd`.

### Architecture
- `boulder.varga.media` - PWA Frontend (nginx container)
- `boulder-api.varga.media` - REST API (Node.js container)

### Deploy Commands
```bash
# Manual deploy via deploy.sh
./deploy.sh
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

## Git Branches

- `main`: Production (Edge Stack deployment)
- `pre`: Preview/Staging

## Notes

- Week numbers follow ISO format: `YYYY-WW`
- All times displayed as "18:30 Uhr" (German format)
- "boulderbar" is shortened to "BB" in displays
- Stats count 1 point per week participated (not per vote)
- SQLite database persisted in Docker volume `boulder-data`
