/**
 * Boulder 2.0 - Mock Data Module
 * For offline development and testing
 */

// Set to false to use real Google Sheets API
const MOCK_MODE = false;

// Members list (alphabetically sorted)
const mockMembers = [
    "Arthur",
    "Caig",
    "David",
    "Gustav",
    "Johannes",
    "Kim",
    "Martin",
    "Matthias",
    "Michelle",
    "Raymonds",
    "Silvia"
];

// Locations list (alphabetically sorted)
const mockLocations = [
    "Blockfabrik",
    "Boulder Monkeys",
    "boulderbar Hannovergasse",
    "boulderbar Hauptbahnhof",
    "boulderbar Seestadt",
    "boulderbar Wienerberg",
    "das flash"
];

// Weekdays available for voting
const mockWeekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday"
];

// Sample votes for testing
const mockVotes = [
    {
        name: "Kim",
        weekdays: ["Monday", "Wednesday"],
        locations: ["Blockfabrik"]
    },
    {
        name: "Arthur",
        weekdays: ["Wednesday"],
        locations: ["Blockfabrik", "das flash"]
    },
    {
        name: "Matthias",
        weekdays: ["Wednesday", "Thursday"],
        locations: ["boulderbar Hannovergasse"]
    },
    {
        name: "Johannes",
        weekdays: ["Wednesday"],
        locations: ["boulderbar Hannovergasse", "Blockfabrik"]
    },
    {
        name: "Silvia",
        weekdays: ["Wednesday", "Friday"],
        locations: ["boulderbar Hannovergasse"]
    },
    {
        name: "Gustav",
        weekdays: ["Tuesday"],
        locations: ["Blockfabrik"]
    },
    {
        name: "Martin",
        weekdays: ["Tuesday", "Thursday"],
        locations: ["das flash"]
    }
];

// Sample statistics for testing
const mockStats = {
    topClimbers: [
        { name: "Matthias", count: 24 },
        { name: "Kim", count: 21 },
        { name: "Arthur", count: 18 },
        { name: "Johannes", count: 15 },
        { name: "Silvia", count: 12 },
        { name: "Gustav", count: 10 },
        { name: "Martin", count: 9 },
        { name: "David", count: 7 },
        { name: "Michelle", count: 6 },
        { name: "Raymonds", count: 5 },
        { name: "Caig", count: 3 }
    ],
    topLocations: [
        { name: "boulderbar Hannovergasse", count: 15 },
        { name: "Blockfabrik", count: 12 },
        { name: "das flash", count: 8 },
        { name: "boulderbar Wienerberg", count: 5 },
        { name: "Boulder Monkeys", count: 4 },
        { name: "boulderbar Hauptbahnhof", count: 3 },
        { name: "boulderbar Seestadt", count: 2 }
    ]
};

// Get current week number
function getCurrentWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 604800000; // milliseconds in a week
    return Math.ceil((diff + start.getDay() * 86400000) / oneWeek);
}

// Mock data object to be used by API module
const MockData = {
    members: [...mockMembers],
    locations: [...mockLocations],
    weekdays: [...mockWeekdays],
    votes: [...mockVotes],
    stats: { ...mockStats },
    weekNumber: getCurrentWeekNumber(),

    // Helper to sort alphabetically
    sortAlphabetically(arr) {
        return arr.sort((a, b) => a.localeCompare(b));
    },

    // Add a member
    addMember(name) {
        if (!this.members.includes(name)) {
            this.members.push(name);
            this.members = this.sortAlphabetically(this.members);
        }
    },

    // Remove a member (also removes their votes)
    removeMember(name) {
        this.members = this.members.filter(m => m !== name);
        this.votes = this.votes.filter(v => v.name !== name);
    },

    // Rename a member
    renameMember(oldName, newName) {
        const index = this.members.indexOf(oldName);
        if (index !== -1) {
            this.members[index] = newName;
            this.members = this.sortAlphabetically(this.members);
        }
        // Update votes
        this.votes.forEach(v => {
            if (v.name === oldName) {
                v.name = newName;
            }
        });
    },

    // Add a location
    addLocation(name) {
        if (!this.locations.includes(name)) {
            this.locations.push(name);
            this.locations = this.sortAlphabetically(this.locations);
        }
    },

    // Remove a location
    removeLocation(name) {
        this.locations = this.locations.filter(l => l !== name);
        // Remove from votes
        this.votes.forEach(v => {
            v.locations = v.locations.filter(l => l !== name);
        });
    },

    // Rename a location
    renameLocation(oldName, newName) {
        const index = this.locations.indexOf(oldName);
        if (index !== -1) {
            this.locations[index] = newName;
            this.locations = this.sortAlphabetically(this.locations);
        }
        // Update votes
        this.votes.forEach(v => {
            const locIndex = v.locations.indexOf(oldName);
            if (locIndex !== -1) {
                v.locations[locIndex] = newName;
            }
        });
    },

    // Get vote for a specific user
    getUserVote(name) {
        return this.votes.find(v => v.name === name) || null;
    },

    // Set vote for a user
    setUserVote(name, weekdays, locations) {
        const existingIndex = this.votes.findIndex(v => v.name === name);
        if (existingIndex !== -1) {
            this.votes[existingIndex] = { name, weekdays, locations };
        } else {
            this.votes.push({ name, weekdays, locations });
        }
    },

    // Remove vote for a user
    removeUserVote(name) {
        this.votes = this.votes.filter(v => v.name !== name);
    }
};
