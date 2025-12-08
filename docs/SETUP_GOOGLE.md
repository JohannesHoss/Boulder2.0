# Google Sheets Backend Setup

## Step 1: Open Your Google Sheet

Open: https://docs.google.com/spreadsheets/d/1mTakEfhAGP47U7FIJdVIL-kNvj5T6zV3SZRj0pbGGGo/

## Step 2: Open Apps Script Editor

1. Go to **Extensions** > **Apps Script**
2. A new tab will open with the script editor

## Step 3: Add the Backend Code

1. Delete any existing code in the editor
2. Copy the entire contents of `docs/Code.gs`
3. Paste it into the Apps Script editor
4. Click **Save** (Ctrl+S / Cmd+S)

## Step 4: Initialize the Sheets

1. In the Apps Script editor, find the function dropdown (top toolbar)
2. Select `initializeSheets`
3. Click **Run**
4. Grant permissions when prompted:
   - Click "Review Permissions"
   - Select your Google account
   - Click "Advanced" > "Go to Boulder 2.0 (unsafe)"
   - Click "Allow"

This creates 4 sheets:
- `members` - List of climbers
- `votes` - Current votes
- `history` - Archived weekly results
- `config` - Settings (locations, weekdays)

## Step 5: Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon next to "Select type" > **Web app**
3. Fill in:
   - Description: `Boulder 2.0 API`
   - Execute as: `Me`
   - Who has access: `Anyone`
4. Click **Deploy**
5. **Copy the Web app URL** (looks like: `https://script.google.com/macros/s/...../exec`)

## Step 6: Connect Frontend to Backend

1. Open `js/api.js` in the Boulder project
2. Find this line:
   ```javascript
   BASE_URL: '',
   ```
3. Paste your Web app URL:
   ```javascript
   BASE_URL: 'https://script.google.com/macros/s/YOUR_ID_HERE/exec',
   ```

4. Open `js/mock.js`
5. Change `MOCK_MODE` to `false`:
   ```javascript
   const MOCK_MODE = false;
   ```

## Step 7: Set Up Weekly Reset Trigger

1. In Apps Script, click the **clock icon** (Triggers) in the left sidebar
2. Click **+ Add Trigger**
3. Configure:
   - Function: `weeklyReset`
   - Event source: `Time-driven`
   - Type: `Week timer`
   - Day: `Sunday`
   - Time: `6am to 7am`
4. Click **Save**

## Step 8: Test the API

Test endpoints in your browser:
- Get config: `YOUR_URL?action=getConfig`
- Get votes: `YOUR_URL?action=getVotes`
- Get stats: `YOUR_URL?action=getStats`

## Troubleshooting

### "Script function not found" error
- Make sure you saved the script after pasting the code

### "Authorization required" error
- Run `initializeSheets` first to grant permissions

### "Access denied" error
- Make sure "Who has access" is set to "Anyone" in deployment

### Changes not reflecting
- After changing the code, create a **New deployment** (not "Manage deployments")
- Each new deployment gets a new URL

## Sheet Structure

### members
| name | active |
|------|--------|
| Arthur | TRUE |
| ... | ... |

### votes
| timestamp | name | weekdays | locations | week_number |
|-----------|------|----------|-----------|-------------|
| 2025-12-08T... | Kim | Monday,Wednesday | Blockfabrik | 2025-50 |

### history
| week_number | winning_day | winning_location | participants |
|-------------|-------------|------------------|--------------|
| 2025-49 | Wednesday | Blockfabrik | 7 |

### config
| key | value |
|-----|-------|
| meeting_time | 18:30 |
| weekday_options | Monday,Tuesday,Wednesday,Thursday,Friday |
| locations | Blockfabrik,Boulder Monkeys,... |
