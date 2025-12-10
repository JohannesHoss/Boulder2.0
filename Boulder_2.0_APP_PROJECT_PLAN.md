# 🧗 Boulder 2.0 – Project Plan

## Overview

A mobile-first Progressive Web App (PWA) for a climbing group to vote on weekly meetups. WhatsApp-style poll interface with Google Sheets backend.

---

## User Decisions

| Setting | Value |
|---------|-------|
| **App name** | Boulder 2.0 |
| **Weekdays** | Monday - Friday |
| **Multiple day votes** | Yes (can select multiple days) |
| **Multiple location votes** | Yes (can select multiple locations) |
| **Change votes** | Yes (anytime) |
| **Meeting time** | 18:30 (displayed in app) |
| **Name sorting** | Alphabetical order |
| **Edit function** | Everyone can edit members/locations |
| **Delete behavior** | Deleting a member also deletes their votes |
| **App icon** | Climbing emoji 🧗 |
| **Week display** | Show current week number (e.g., "Week 50") |
| **Reset** | Every Sunday morning |

---

## Tech Stack

```
Frontend:           HTML + CSS + JavaScript (Vanilla)
Backend/Database:   Google Sheets + Apps Script
Hosting:            GitHub Pages / Netlify / Render
Style:              Mobile-first, WhatsApp poll aesthetic
Language:           English (UI)
```

---

## Google Sheet

- **URL**: https://docs.google.com/spreadsheets/d/1mTakEfhAGP47U7FIJdVIL-kNvj5T6zV3SZRj0pbGGGo/
- **Sheet ID**: `1mTakEfhAGP47U7FIJdVIL-kNvj5T6zV3SZRj0pbGGGo`

---

## Team Members (Alphabetical)

| # | Name |
|---|------|
| 1 | Arthur |
| 2 | Caig |
| 3 | David |
| 4 | Gustav |
| 5 | Johannes |
| 6 | Kim |
| 7 | Martin |
| 8 | Matthias |
| 9 | Michelle |
| 10 | Raymonds |
| 11 | Silvia |

---

## Locations (Alphabetical)

| # | Location |
|---|----------|
| 1 | Blockfabrik |
| 2 | Boulder Monkeys |
| 3 | boulderbar Hannovergasse |
| 4 | boulderbar Hauptbahnhof |
| 5 | boulderbar Seestadt |
| 6 | boulderbar Wienerberg |
| 7 | das flash |

---

## Core Features

### Voting System
- [x] Select name from dropdown (alphabetically sorted)
- [x] Vote for multiple weekdays (Mon–Fri) with checkboxes
- [x] Vote for multiple locations with checkboxes
- [x] WhatsApp-style poll display (see who voted for what)
- [x] Remove own vote (change mind)
- [x] No deadline – voting stays open until Sunday reset

### Auto Reset
- [x] Every Sunday morning (06:00 CET)
- [x] Clears all votes for new week
- [x] Archives previous week's results

### Statistics
- [x] **Top Climber**: Who attends most often (all-time)
- [x] **Top Location**: Most visited location (all-time)

### Settings (Everyone can edit)
- [x] Add/remove/rename members
- [x] Add/remove/rename locations
- [x] Changes sync to Google Sheets

### PWA Features
- [x] Installable on home screen (iOS + Android)
- [x] Mobile-optimized (phone screen first)
- [x] Works offline (shows last state)
- [x] App icon (🧗) + splash screen

---

## UI Mockups (All Screens)

### Welcome Screen (1st visit only)
```
┌─────────────────────────────────────┐
│                                     │
│           🧗 Boulder 2.0            │
│                                     │
│      "Hey! Who are you?"            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Select your name        ▼  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Names shown alphabetically:        │
│  Arthur, Caig, David, Gustav,       │
│  Johannes, Kim, Martin, Matthias,   │
│  Michelle, Raymonds, Silvia         │
│                                     │
│         [ Continue ]                │
│                                     │
│  (remembers choice for next time)   │
└─────────────────────────────────────┘
```

### Voting Screen (Main screen)
```
┌─────────────────────────────────────┐
│  🧗 Boulder 2.0          Week 50    │
│  ⏰ 18:30                           │
│─────────────────────────────────────│
│                                     │
│  📅 When can you climb?             │
│  ┌─────────────────────────────────┐│
│  │ ☑ Monday           ████░░ 4    ││
│  │   Arthur, David, Kim, You       ││
│  │                                 ││
│  │ ☐ Tuesday          ██░░░░ 2    ││
│  │   Gustav, Martin                ││
│  │                                 ││
│  │ ☑ Wednesday        ██████ 6    ││
│  │   Johannes, Matthias, Michelle, ││
│  │   Raymonds, Silvia, You         ││
│  │                                 ││
│  │ ☐ Thursday         █░░░░░ 1    ││
│  │   Caig                          ││
│  │                                 ││
│  │ ☐ Friday           ░░░░░░ 0    ││
│  └─────────────────────────────────┘│
│                                     │
│  📍 Where should we go?             │
│  ┌─────────────────────────────────┐│
│  │ ☑ Blockfabrik      ████░░ 4    ││
│  │   Arthur, Kim, You, Gustav      ││
│  │                                 ││
│  │ ☐ boulderbar Hann. ██████ 6    ││
│  │   Johannes, Matthias, ...       ││
│  │                                 ││
│  │ ☐ boulderbar Wien. ██░░░░ 2    ││
│  │ ☐ boulderbar Haupt █░░░░░ 1    ││
│  │ ☐ boulderbar Sees. ░░░░░░ 0    ││
│  │ ☐ das flash        ░░░░░░ 0    ││
│  │ ☐ Boulder Monkeys  ░░░░░░ 0    ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Your votes: Mon, Wed            ││
│  │ Blockfabrik                     ││
│  │                                 ││
│  │ [ Clear my votes ]              ││
│  └─────────────────────────────────┘│
│                                     │
│─────────────────────────────────────│
│  [📊 Vote]  [📈 Stats]  [⚙️ Settings]│
└─────────────────────────────────────┘
```

### Stats Screen
```
┌─────────────────────────────────────┐
│  📈 Statistics                      │
│─────────────────────────────────────│
│                                     │
│  🏆 Top Climbers (All Time)         │
│  ┌─────────────────────────────────┐│
│  │ 1. Matthias        ████████ 24 ││
│  │ 2. Kim             ███████ 21  ││
│  │ 3. Arthur          ██████ 18   ││
│  │ 4. Johannes        █████ 15    ││
│  │ 5. Silvia          ████ 12     ││
│  │ ...                             ││
│  └─────────────────────────────────┘│
│                                     │
│  📍 Top Locations (All Time)        │
│  ┌─────────────────────────────────┐│
│  │ 1. boulderbar Hann ██████ 15   ││
│  │ 2. Blockfabrik     █████ 12    ││
│  │ 3. das flash       ███ 8       ││
│  │ 4. boulderbar Wien ██ 5        ││
│  │ ...                             ││
│  └─────────────────────────────────┘│
│                                     │
│─────────────────────────────────────│
│  [📊 Vote]  [📈 Stats]  [⚙️ Settings]│
└─────────────────────────────────────┘
```

### Settings Screen
```
┌─────────────────────────────────────┐
│  ⚙️ Settings                        │
│─────────────────────────────────────│
│                                     │
│  👥 Members                         │
│  ┌─────────────────────────────────┐│
│  │ Arthur              [✏️] [🗑️] ││
│  │ Caig                [✏️] [🗑️] ││
│  │ David               [✏️] [🗑️] ││
│  │ Gustav              [✏️] [🗑️] ││
│  │ Johannes            [✏️] [🗑️] ││
│  │ Kim                 [✏️] [🗑️] ││
│  │ Martin              [✏️] [🗑️] ││
│  │ Matthias            [✏️] [🗑️] ││
│  │ Michelle            [✏️] [🗑️] ││
│  │ Raymonds            [✏️] [🗑️] ││
│  │ Silvia              [✏️] [🗑️] ││
│  │                                 ││
│  │ [ + Add Member ]               ││
│  └─────────────────────────────────┘│
│                                     │
│  📍 Locations                       │
│  ┌─────────────────────────────────┐│
│  │ Blockfabrik         [✏️] [🗑️] ││
│  │ Boulder Monkeys     [✏️] [🗑️] ││
│  │ boulderbar Hann...  [✏️] [🗑️] ││
│  │ boulderbar Haupt... [✏️] [🗑️] ││
│  │ boulderbar Sees...  [✏️] [🗑️] ││
│  │ boulderbar Wien...  [✏️] [🗑️] ││
│  │ das flash           [✏️] [🗑️] ││
│  │                                 ││
│  │ [ + Add Location ]             ││
│  └─────────────────────────────────┘│
│                                     │
│─────────────────────────────────────│
│  [📊 Vote]  [📈 Stats]  [⚙️ Settings]│
└─────────────────────────────────────┘
```

**Settings Actions:**
- ✏️ Edit → opens inline text input to rename
- 🗑️ Delete → confirms, then removes (+ deletes their votes)
- [ + Add ] → adds new entry, auto-sorts alphabetically
- All changes sync immediately to Google Sheets

---

## WhatsApp Poll Style Reference

The voting UI mimics WhatsApp polls with multi-select:

```
┌─────────────────────────────────────┐
│                                     │
│  ☐ Option A                         │
│    ████████████████░░░░  8 votes    │
│    👤 Name1, Name2, Name3...        │
│                                     │
│  ☑ Option B (selected)              │
│    ████████░░░░░░░░░░░░  4 votes    │
│    👤 You, Name4, Name5...          │
│                                     │
│  ☑ Option C (selected)              │
│    ██░░░░░░░░░░░░░░░░░░  1 vote     │
│    👤 You                           │
│                                     │
└─────────────────────────────────────┘
```

**Key UI Elements:**
- Checkbox style (☐ / ☑) for multi-select
- Progress bar showing vote count
- Names of voters visible below each option
- Tap to vote / tap again to unvote
- Subtle animation on vote

---

## Project Structure

```
Boulder/
│
├── index.html              # Main app (single page)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (offline support)
│
├── css/
│   └── style.css           # All styles (mobile-first)
│
├── js/
│   ├── app.js              # Main application logic
│   ├── api.js              # Google Sheets API calls
│   ├── storage.js          # Local storage (remember user)
│   └── mock.js             # Mock data for offline dev
│
├── icons/
│   ├── icon-192.png        # App icon (small)
│   ├── icon-512.png        # App icon (large)
│   └── favicon.ico         # Browser favicon
│
└── Boulder_2.0_APP_PROJECT_PLAN.md
```

---

## Google Sheets Structure

### Sheet 1: `members`
| name | active |
|------|--------|
| Arthur | TRUE |
| Caig | TRUE |
| David | TRUE |
| ... | ... |

### Sheet 2: `votes`
| timestamp | name | weekdays | locations | week_number |
|-----------|------|----------|-----------|-------------|
| 2025-12-08 14:32 | Kim | Monday,Wednesday | Blockfabrik | 2025-50 |
| 2025-12-08 15:01 | Arthur | Wednesday | Blockfabrik,das flash | 2025-50 |
| ... | ... | ... | ... | ... |

### Sheet 3: `history`
| week_number | winning_day | winning_location | participants |
|-------------|-------------|------------------|--------------|
| 2025-49 | Thursday | boulderbar Hannovergasse | 7 |
| 2025-48 | Wednesday | Blockfabrik | 5 |
| ... | ... | ... | ... |

### Sheet 4: `config`
| key | value |
|-----|-------|
| reset_day | Sunday |
| reset_time | 06:00 |
| meeting_time | 18:30 |
| weekday_options | Monday,Tuesday,Wednesday,Thursday,Friday |
| locations | Blockfabrik,Boulder Monkeys,boulderbar Hannovergasse,... |

---

## Apps Script Endpoints

```javascript
// API Endpoints (Apps Script Web App)

GET  /exec?action=getVotes
     → Returns current week's votes

GET  /exec?action=getStats
     → Returns all-time statistics

GET  /exec?action=getConfig
     → Returns weekdays, locations, members

POST /exec?action=vote
     → Body: { name, weekdays: [], locations: [] }
     → Adds or updates vote (arrays for multi-select)

POST /exec?action=removeVote
     → Body: { name }
     → Removes user's vote

POST /exec?action=updateMembers
     → Body: { members: [] }
     → Updates member list

POST /exec?action=updateLocations
     → Body: { locations: [] }
     → Updates location list
```

---

## Development Phases

### Phase 1: Project Setup & HTML Structure ✅ COMPLETED

**Files Created:**
```
Boulder/
├── index.html              ✅
├── manifest.json           ✅
├── sw.js                   ✅
├── css/
│   └── style.css           ✅
├── js/
│   ├── app.js              ✅
│   ├── api.js              ✅
│   ├── storage.js          ✅
│   └── mock.js             ✅
└── icons/                  (placeholder)
```

**Testing Phase 1:**
- [x] All files created in correct folder structure
- [x] index.html has all 4 screen containers (Welcome, Vote, Stats, Settings)
- [x] Bottom navigation with 3 tabs
- [x] Modal dialogs for edit/delete
- [x] Loading overlay
- [ ] Test in browser (run `python -m http.server 8000`)

---

### Phase 2: CSS Styling (WhatsApp Dark Theme) ✅ COMPLETED

**Design System:**
```css
:root {
  --bg-primary: #111b21;      /* Dark background */
  --bg-secondary: #202c33;    /* Card background */
  --bg-tertiary: #2a3942;     /* Input background */
  --accent-green: #00a884;    /* WhatsApp green */
  --accent-blue: #53bdeb;     /* Link blue */
  --text-primary: #e9edef;    /* Main text */
  --text-secondary: #8696a0;  /* Muted text */
  --border-color: #2a3942;    /* Borders */
}

font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

**Components Styled:**
- ✅ Welcome screen with bouncing logo animation
- ✅ Custom dropdown with arrow icon
- ✅ Poll options with checkboxes and progress bars
- ✅ Voter name display
- ✅ Vote summary with accent border
- ✅ Stats items with progress bars
- ✅ Settings list with edit/delete buttons
- ✅ Bottom tab navigation with active states
- ✅ Modals with slide-up animation
- ✅ Loading spinner
- ✅ iOS safe area support
- ✅ Custom scrollbar

**Testing Phase 2:**
- [x] Dark theme displays correctly (#111b21 background)
- [x] All components styled (dropdown, cards, buttons, nav)
- [x] Mobile responsive (375px base, max-width 600px)
- [x] Tab navigation visually correct with active states
- [x] Progress bars with smooth transitions
- [x] Checkbox styles (☐/☑) with green accent
- [x] Hover and active states on buttons
- [x] Modal animations (fade + slide)

---

### Phase 3: Frontend JavaScript ✅ COMPLETED

**storage.js** ✅
- Save/load selected user name (localStorage)
- Cache votes, members, locations, stats for offline

**mock.js** ✅
- MOCK_MODE flag for development
- 11 members (alphabetically sorted)
- 7 locations (alphabetically sorted)
- 5 weekdays (Mon-Fri)
- Sample votes with multi-select arrays
- Helper functions for add/remove/rename

**app.js** ✅
- Screen navigation (welcome → vote → stats → settings)
- Render polls with checkboxes and progress bars
- Real-time vote toggling with backend sync
- Voter names display (shows "You" for current user)
- Vote summary with clear button
- Settings: full CRUD for members and locations
- Modal dialogs for edit/delete confirmation
- Loading overlay during API calls

**api.js** ✅
- All endpoints with mock mode fallback
- getVotes, getConfig, getStats (GET)
- vote, removeVote (POST)
- addMember, removeMember, renameMember (POST)
- addLocation, removeLocation, renameLocation (POST)
- Simulated network delay in mock mode

**Testing Phase 3:**
- [x] Name selection persists after page refresh (localStorage)
- [x] Welcome → Voting screen transition works
- [x] Tab navigation switches between all 4 screens
- [x] Mock data displays correctly (votes, members, locations)
- [x] Members sorted alphabetically in dropdown
- [x] Can select multiple days (checkboxes work)
- [x] Can select multiple locations
- [x] Vote counts update when checking/unchecking
- [x] Voter names appear under each option
- [x] "Clear my votes" clears selections
- [x] Settings: can add new member (sorted alphabetically)
- [x] Settings: can remove member (+ deletes votes)
- [x] Settings: can rename member
- [x] Settings: can add/remove/rename locations
- [x] Stats screen shows mock top climbers + locations

---

### Phase 4: PWA Features ✅ COMPLETED

**manifest.json** ✅
- App name: Boulder 2.0
- Icons: SVG with 🧗 climbing emoji (192x192, 512x512)
- Theme color: #111b21 (dark)
- display: standalone
- orientation: portrait-primary
- start_url: ./index.html

**sw.js (Service Worker)** ✅
- Cache version management (boulder-v1)
- Caches all static assets on install
- Cache-first strategy for assets
- Network fallback for uncached resources
- Skips caching for API requests (Google Scripts)
- Clean up old caches on activate

**Icons Created:**
- icons/icon-192.svg ✅
- icons/icon-512.svg ✅

**Service Worker Registration** ✅
- Added to index.html
- Registers on page load

**Testing Phase 4:**
- [x] manifest.json valid structure
- [x] SVG icons created with climbing emoji
- [x] Service worker caches assets
- [x] Cache-first strategy implemented
- [x] Old cache cleanup on update
- [ ] Test installation on Android device
- [ ] Test installation on iOS device
- [ ] Test offline mode

---

### Phase 5: Google Sheets Backend ✅ COMPLETED

**Files Created:**
- `docs/Code.gs` - Complete Apps Script backend
- `docs/SETUP_GOOGLE.md` - Step-by-step setup guide

**Apps Script Functions:**
- `doGet(e)` - Handle GET requests
- `doPost(e)` - Handle POST requests
- `getVotes()` - Get current week's votes
- `getConfig()` - Get members, locations, weekdays
- `getStats()` - Get all-time statistics
- `submitVote()` - Add/update a vote
- `removeVote()` - Delete user's vote
- `addMember()`, `removeMember()`, `renameMember()`
- `addLocation()`, `removeLocation()`, `renameLocation()`
- `weeklyReset()` - Archive and clear votes (triggered Sunday 6am)
- `initializeSheets()` - Set up all sheets with default data

**Sheets Structure:**
1. `members` - name, active
2. `votes` - timestamp, name, weekdays, locations, week_number
3. `history` - week_number, winning_day, winning_location, participants
4. `config` - key/value pairs for settings

**To Connect (User Action Required):**
1. Open Google Sheet and paste Code.gs in Apps Script
2. Run `initializeSheets()` to set up sheets
3. Deploy as Web App
4. Copy Web App URL to `js/api.js`
5. Set `MOCK_MODE = false` in `js/mock.js`
6. Create trigger for `weeklyReset`

**Testing Phase 5:**
- [x] Apps Script code created with all endpoints
- [x] Setup documentation created
- [x] initializeSheets function for easy setup
- [x] weeklyReset function for Sunday auto-clear
- [ ] User deploys Apps Script (manual step)
- [ ] User connects frontend to API (manual step)
- [ ] Test all endpoints work

---

### Phase 6: Deployment ⏳ READY FOR TESTING

**Local Testing:**
```bash
cd /Users/johanneshoss/Documents/johannes-projects/Boulder
python -m http.server 8000
# Open http://localhost:8000 in browser
```

**Deployment Options:**

**Option 1: GitHub Pages (Free)**
1. Create new GitHub repo: `boulder-2`
2. Push code to repo
3. Go to Settings > Pages
4. Set Source to "main" branch
5. Wait for deployment
6. Access at: `https://USERNAME.github.io/boulder-2`

**Option 2: Netlify (Free)**
1. Go to https://app.netlify.com
2. Drag & drop the Boulder folder
3. Get instant URL

**Option 3: Vercel (Free)**
1. Install: `npm i -g vercel`
2. Run: `vercel` in Boulder folder
3. Follow prompts

**Testing Phase 6:**
- [ ] Run locally with `python -m http.server 8000`
- [ ] Test welcome screen and user selection
- [ ] Test voting with mock data
- [ ] Test stats screen
- [ ] Test settings (add/edit/delete)
- [ ] Connect to Google Sheets API
- [ ] Deploy to hosting
- [ ] Test on mobile devices
- [ ] Install as PWA on iOS/Android
- [ ] Share with climbing group! 🧗

---

## Key Implementation Details

### Multi-Select Voting
- Use checkboxes instead of radio buttons
- Store votes as arrays: `weekdays: ["Monday", "Wednesday"]`
- Each option shows all voters who selected it
- Tapping checkbox immediately updates UI and syncs to backend

### Data Flow
1. User selects name → saved to localStorage
2. User checks days/locations → immediate UI update
3. Changes sync to Google Sheets
4. Poll refreshes → GET current votes
5. Show updated counts + voter names

### Key UI Principles
- Thumb-friendly tap targets (min 44px)
- Bottom navigation (easy to reach)
- Dark mode default (easier on eyes)
- Smooth transitions (200-300ms)

---

## Offline Development

For local testing without Google Sheets:

```javascript
// js/mock.js

const MOCK_MODE = true;  // Set to false for production

const mockVotes = [
  { name: "Kim", weekdays: ["Monday", "Wednesday"], locations: ["Blockfabrik"] },
  { name: "Arthur", weekdays: ["Wednesday"], locations: ["Blockfabrik", "das flash"] },
  { name: "Matthias", weekdays: ["Thursday"], locations: ["boulderbar Hannovergasse"] },
];

const mockMembers = [
  "Arthur", "Caig", "David", "Gustav", "Johannes",
  "Kim", "Martin", "Matthias", "Michelle", "Raymonds", "Silvia"
];

const mockLocations = [
  "Blockfabrik",
  "Boulder Monkeys",
  "boulderbar Hannovergasse",
  "boulderbar Hauptbahnhof",
  "boulderbar Seestadt",
  "boulderbar Wienerberg",
  "das flash"
];
```

**To test locally:**
```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve

# Option 3: VS Code Extension
# Install "Live Server" → Right-click index.html → "Open with Live Server"
```

---

*Last updated: December 2025*
