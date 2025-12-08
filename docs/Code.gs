/**
 * Boulder 2.0 - Google Apps Script Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1mTakEfhAGP47U7FIJdVIL-kNvj5T6zV3SZRj0pbGGGo/
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Click "Deploy" > "New deployment"
 * 5. Select "Web app"
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Click "Deploy" and copy the Web App URL
 * 9. Paste the URL in js/api.js as BASE_URL
 * 10. Set MOCK_MODE = false in js/mock.js
 */

// Sheet names
const SHEETS = {
  MEMBERS: 'members',
  VOTES: 'votes',
  HISTORY: 'history',
  CONFIG: 'config'
};

/**
 * Handle GET requests
 */
function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'getVotes':
        result = getVotes();
        break;
      case 'getConfig':
        result = getConfig();
        break;
      case 'getStats':
        result = getStats();
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    result = { success: false, error: error.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  const action = e.parameter.action;
  let data;

  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let result;

  try {
    switch (action) {
      case 'vote':
        result = submitVote(data.name, data.weekdays, data.locations);
        break;
      case 'removeVote':
        result = removeVote(data.name);
        break;
      case 'addMember':
        result = addMember(data.name);
        break;
      case 'removeMember':
        result = removeMember(data.name);
        break;
      case 'renameMember':
        result = renameMember(data.oldName, data.newName);
        break;
      case 'addLocation':
        result = addLocation(data.name);
        break;
      case 'removeLocation':
        result = removeLocation(data.name);
        break;
      case 'renameLocation':
        result = renameLocation(data.oldName, data.newName);
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    result = { success: false, error: error.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get current week number
 */
function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  const weekNum = Math.ceil((diff + start.getDay() * 86400000) / oneWeek);
  return now.getFullYear() + '-' + weekNum;
}

/**
 * Get all votes for current week
 */
function getVotes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const votesSheet = ss.getSheetByName(SHEETS.VOTES);
  const currentWeek = getCurrentWeekNumber();

  if (!votesSheet) {
    return { success: true, data: [], weekNumber: currentWeek };
  }

  const data = votesSheet.getDataRange().getValues();
  const headers = data[0];
  const votes = [];

  const nameIdx = headers.indexOf('name');
  const weekdaysIdx = headers.indexOf('weekdays');
  const locationsIdx = headers.indexOf('locations');
  const weekIdx = headers.indexOf('week_number');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[weekIdx] === currentWeek) {
      votes.push({
        name: row[nameIdx],
        weekdays: row[weekdaysIdx] ? row[weekdaysIdx].split(',') : [],
        locations: row[locationsIdx] ? row[locationsIdx].split(',') : []
      });
    }
  }

  return {
    success: true,
    data: votes,
    weekNumber: parseInt(currentWeek.split('-')[1])
  };
}

/**
 * Get configuration (members, locations, weekdays)
 */
function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const membersSheet = ss.getSheetByName(SHEETS.MEMBERS);
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);

  // Get members
  let members = [];
  if (membersSheet) {
    const membersData = membersSheet.getDataRange().getValues();
    for (let i = 1; i < membersData.length; i++) {
      if (membersData[i][1] === true || membersData[i][1] === 'TRUE') {
        members.push(membersData[i][0]);
      }
    }
  }
  members.sort();

  // Get locations from config
  let locations = [];
  let weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (configSheet) {
    const configData = configSheet.getDataRange().getValues();
    for (let i = 1; i < configData.length; i++) {
      const key = configData[i][0];
      const value = configData[i][1];
      if (key === 'locations' && value) {
        locations = value.split(',').map(l => l.trim()).sort();
      }
      if (key === 'weekday_options' && value) {
        weekdays = value.split(',').map(d => d.trim());
      }
    }
  }

  return {
    success: true,
    members: members,
    locations: locations,
    weekdays: weekdays
  };
}

/**
 * Get statistics
 */
function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName(SHEETS.HISTORY);
  const votesSheet = ss.getSheetByName(SHEETS.VOTES);

  const climberCounts = {};
  const locationCounts = {};

  // Count from history
  if (historySheet) {
    const historyData = historySheet.getDataRange().getValues();
    for (let i = 1; i < historyData.length; i++) {
      const participants = historyData[i][3];
      const location = historyData[i][2];

      if (location) {
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    }
  }

  // Count from all votes
  if (votesSheet) {
    const votesData = votesSheet.getDataRange().getValues();
    const headers = votesData[0];
    const nameIdx = headers.indexOf('name');
    const locationsIdx = headers.indexOf('locations');

    for (let i = 1; i < votesData.length; i++) {
      const name = votesData[i][nameIdx];
      const locations = votesData[i][locationsIdx];

      if (name) {
        climberCounts[name] = (climberCounts[name] || 0) + 1;
      }

      if (locations) {
        locations.split(',').forEach(loc => {
          const trimmed = loc.trim();
          if (trimmed) {
            locationCounts[trimmed] = (locationCounts[trimmed] || 0) + 1;
          }
        });
      }
    }
  }

  // Convert to sorted arrays
  const topClimbers = Object.entries(climberCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const topLocations = Object.entries(locationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    success: true,
    data: {
      topClimbers: topClimbers,
      topLocations: topLocations
    }
  };
}

/**
 * Submit or update a vote
 */
function submitVote(name, weekdays, locations) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let votesSheet = ss.getSheetByName(SHEETS.VOTES);

  // Create sheet if it doesn't exist
  if (!votesSheet) {
    votesSheet = ss.insertSheet(SHEETS.VOTES);
    votesSheet.appendRow(['timestamp', 'name', 'weekdays', 'locations', 'week_number']);
  }

  const currentWeek = getCurrentWeekNumber();
  const data = votesSheet.getDataRange().getValues();
  const headers = data[0];
  const nameIdx = headers.indexOf('name');
  const weekIdx = headers.indexOf('week_number');

  // Find existing vote for this user this week
  let rowToUpdate = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][nameIdx] === name && data[i][weekIdx] === currentWeek) {
      rowToUpdate = i + 1; // 1-indexed for Sheets
      break;
    }
  }

  const weekdaysStr = weekdays.join(',');
  const locationsStr = locations.join(',');
  const timestamp = new Date().toISOString();

  if (rowToUpdate > 0) {
    // Update existing vote
    votesSheet.getRange(rowToUpdate, 1).setValue(timestamp);
    votesSheet.getRange(rowToUpdate, headers.indexOf('weekdays') + 1).setValue(weekdaysStr);
    votesSheet.getRange(rowToUpdate, headers.indexOf('locations') + 1).setValue(locationsStr);
  } else {
    // Add new vote
    votesSheet.appendRow([timestamp, name, weekdaysStr, locationsStr, currentWeek]);
  }

  return { success: true };
}

/**
 * Remove a user's vote for current week
 */
function removeVote(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const votesSheet = ss.getSheetByName(SHEETS.VOTES);

  if (!votesSheet) {
    return { success: true };
  }

  const currentWeek = getCurrentWeekNumber();
  const data = votesSheet.getDataRange().getValues();
  const headers = data[0];
  const nameIdx = headers.indexOf('name');
  const weekIdx = headers.indexOf('week_number');

  // Find and delete the row
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][nameIdx] === name && data[i][weekIdx] === currentWeek) {
      votesSheet.deleteRow(i + 1);
      break;
    }
  }

  return { success: true };
}

/**
 * Add a new member
 */
function addMember(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let membersSheet = ss.getSheetByName(SHEETS.MEMBERS);

  if (!membersSheet) {
    membersSheet = ss.insertSheet(SHEETS.MEMBERS);
    membersSheet.appendRow(['name', 'active']);
  }

  // Check if member already exists
  const data = membersSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      return { success: false, error: 'Member already exists' };
    }
  }

  membersSheet.appendRow([name, true]);
  return { success: true, members: getConfig().members };
}

/**
 * Remove a member (and their votes)
 */
function removeMember(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const membersSheet = ss.getSheetByName(SHEETS.MEMBERS);
  const votesSheet = ss.getSheetByName(SHEETS.VOTES);

  // Remove from members sheet
  if (membersSheet) {
    const data = membersSheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === name) {
        membersSheet.deleteRow(i + 1);
        break;
      }
    }
  }

  // Remove all votes by this member
  if (votesSheet) {
    const data = votesSheet.getDataRange().getValues();
    const headers = data[0];
    const nameIdx = headers.indexOf('name');

    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][nameIdx] === name) {
        votesSheet.deleteRow(i + 1);
      }
    }
  }

  return { success: true, members: getConfig().members };
}

/**
 * Rename a member
 */
function renameMember(oldName, newName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const membersSheet = ss.getSheetByName(SHEETS.MEMBERS);
  const votesSheet = ss.getSheetByName(SHEETS.VOTES);

  // Update in members sheet
  if (membersSheet) {
    const data = membersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === oldName) {
        membersSheet.getRange(i + 1, 1).setValue(newName);
        break;
      }
    }
  }

  // Update in votes sheet
  if (votesSheet) {
    const data = votesSheet.getDataRange().getValues();
    const headers = data[0];
    const nameIdx = headers.indexOf('name');

    for (let i = 1; i < data.length; i++) {
      if (data[i][nameIdx] === oldName) {
        votesSheet.getRange(i + 1, nameIdx + 1).setValue(newName);
      }
    }
  }

  return { success: true, members: getConfig().members };
}

/**
 * Add a new location
 */
function addLocation(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName(SHEETS.CONFIG);

  if (!configSheet) {
    configSheet = ss.insertSheet(SHEETS.CONFIG);
    configSheet.appendRow(['key', 'value']);
  }

  const data = configSheet.getDataRange().getValues();
  let locationRow = -1;
  let existingLocations = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'locations') {
      locationRow = i + 1;
      existingLocations = data[i][1] ? data[i][1].split(',').map(l => l.trim()) : [];
      break;
    }
  }

  if (!existingLocations.includes(name)) {
    existingLocations.push(name);
    existingLocations.sort();
  }

  const newValue = existingLocations.join(',');

  if (locationRow > 0) {
    configSheet.getRange(locationRow, 2).setValue(newValue);
  } else {
    configSheet.appendRow(['locations', newValue]);
  }

  return { success: true, locations: existingLocations };
}

/**
 * Remove a location
 */
function removeLocation(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);
  const votesSheet = ss.getSheetByName(SHEETS.VOTES);

  if (configSheet) {
    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'locations') {
        let locations = data[i][1] ? data[i][1].split(',').map(l => l.trim()) : [];
        locations = locations.filter(l => l !== name);
        configSheet.getRange(i + 1, 2).setValue(locations.join(','));
        break;
      }
    }
  }

  // Remove location from votes
  if (votesSheet) {
    const data = votesSheet.getDataRange().getValues();
    const headers = data[0];
    const locationsIdx = headers.indexOf('locations');

    for (let i = 1; i < data.length; i++) {
      let locations = data[i][locationsIdx] ? data[i][locationsIdx].split(',').map(l => l.trim()) : [];
      if (locations.includes(name)) {
        locations = locations.filter(l => l !== name);
        votesSheet.getRange(i + 1, locationsIdx + 1).setValue(locations.join(','));
      }
    }
  }

  return { success: true, locations: getConfig().locations };
}

/**
 * Rename a location
 */
function renameLocation(oldName, newName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEETS.CONFIG);
  const votesSheet = ss.getSheetByName(SHEETS.VOTES);

  // Update in config
  if (configSheet) {
    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'locations') {
        let locations = data[i][1] ? data[i][1].split(',').map(l => l.trim()) : [];
        locations = locations.map(l => l === oldName ? newName : l);
        locations.sort();
        configSheet.getRange(i + 1, 2).setValue(locations.join(','));
        break;
      }
    }
  }

  // Update in votes
  if (votesSheet) {
    const data = votesSheet.getDataRange().getValues();
    const headers = data[0];
    const locationsIdx = headers.indexOf('locations');

    for (let i = 1; i < data.length; i++) {
      let locations = data[i][locationsIdx] ? data[i][locationsIdx].split(',').map(l => l.trim()) : [];
      if (locations.includes(oldName)) {
        locations = locations.map(l => l === oldName ? newName : l);
        votesSheet.getRange(i + 1, locationsIdx + 1).setValue(locations.join(','));
      }
    }
  }

  return { success: true, locations: getConfig().locations };
}

/**
 * Weekly reset - run this with a time-based trigger every Sunday at 06:00
 *
 * To set up the trigger:
 * 1. In Apps Script, go to Triggers (clock icon in left sidebar)
 * 2. Click "+ Add Trigger"
 * 3. Choose function: weeklyReset
 * 4. Event source: Time-driven
 * 5. Type: Week timer
 * 6. Day: Sunday
 * 7. Time: 6am to 7am
 * 8. Click Save
 */
function weeklyReset() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const votesSheet = ss.getSheetByName(SHEETS.VOTES);
  let historySheet = ss.getSheetByName(SHEETS.HISTORY);

  if (!votesSheet) return;

  // Create history sheet if it doesn't exist
  if (!historySheet) {
    historySheet = ss.insertSheet(SHEETS.HISTORY);
    historySheet.appendRow(['week_number', 'winning_day', 'winning_location', 'participants']);
  }

  const currentWeek = getCurrentWeekNumber();
  const data = votesSheet.getDataRange().getValues();
  const headers = data[0];
  const weekdaysIdx = headers.indexOf('weekdays');
  const locationsIdx = headers.indexOf('locations');
  const weekIdx = headers.indexOf('week_number');

  // Count votes for this week
  const dayCounts = {};
  const locationCounts = {};
  let participantCount = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i][weekIdx] === currentWeek) {
      participantCount++;

      const weekdays = data[i][weekdaysIdx] ? data[i][weekdaysIdx].split(',') : [];
      const locations = data[i][locationsIdx] ? data[i][locationsIdx].split(',') : [];

      weekdays.forEach(day => {
        const trimmed = day.trim();
        if (trimmed) dayCounts[trimmed] = (dayCounts[trimmed] || 0) + 1;
      });

      locations.forEach(loc => {
        const trimmed = loc.trim();
        if (trimmed) locationCounts[trimmed] = (locationCounts[trimmed] || 0) + 1;
      });
    }
  }

  // Find winners
  const winningDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const winningLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  // Archive to history
  if (participantCount > 0) {
    historySheet.appendRow([currentWeek, winningDay, winningLocation, participantCount]);
  }

  // Clear current week's votes
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][weekIdx] === currentWeek) {
      votesSheet.deleteRow(i + 1);
    }
  }

  Logger.log('Weekly reset completed for week ' + currentWeek);
}

/**
 * Initialize sheets with default data
 * Run this once to set up the spreadsheet
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create members sheet
  let membersSheet = ss.getSheetByName(SHEETS.MEMBERS);
  if (!membersSheet) {
    membersSheet = ss.insertSheet(SHEETS.MEMBERS);
    membersSheet.appendRow(['name', 'active']);

    const members = [
      'Arthur', 'Caig', 'David', 'Gustav', 'Johannes',
      'Kim', 'Martin', 'Matthias', 'Michelle', 'Raymonds', 'Silvia'
    ];

    members.forEach(name => {
      membersSheet.appendRow([name, true]);
    });
  }

  // Create config sheet
  let configSheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!configSheet) {
    configSheet = ss.insertSheet(SHEETS.CONFIG);
    configSheet.appendRow(['key', 'value']);
    configSheet.appendRow(['reset_day', 'Sunday']);
    configSheet.appendRow(['reset_time', '06:00']);
    configSheet.appendRow(['meeting_time', '18:30']);
    configSheet.appendRow(['weekday_options', 'Monday,Tuesday,Wednesday,Thursday,Friday']);
    configSheet.appendRow(['locations', 'Blockfabrik,Boulder Monkeys,boulderbar Hannovergasse,boulderbar Hauptbahnhof,boulderbar Seestadt,boulderbar Wienerberg,das flash']);
  }

  // Create votes sheet
  let votesSheet = ss.getSheetByName(SHEETS.VOTES);
  if (!votesSheet) {
    votesSheet = ss.insertSheet(SHEETS.VOTES);
    votesSheet.appendRow(['timestamp', 'name', 'weekdays', 'locations', 'week_number']);
  }

  // Create history sheet
  let historySheet = ss.getSheetByName(SHEETS.HISTORY);
  if (!historySheet) {
    historySheet = ss.insertSheet(SHEETS.HISTORY);
    historySheet.appendRow(['week_number', 'winning_day', 'winning_location', 'participants']);
  }

  Logger.log('Sheets initialized successfully!');
}
