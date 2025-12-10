/**
 * Boulder 2.0 - Main Application
 * Single Page Layout with English UI
 */

// Weekday display names (full)
const WEEKDAY_NAMES = {
    'Monday': 'Monday',
    'Tuesday': 'Tuesday',
    'Wednesday': 'Wednesday',
    'Thursday': 'Thursday',
    'Friday': 'Friday',
    'Saturday': 'Saturday',
    'Sunday': 'Sunday'
};

// Short weekday abbreviations
const WEEKDAY_SHORT = {
    'Monday': 'MON',
    'Tuesday': 'TUE',
    'Wednesday': 'WED',
    'Thursday': 'THU',
    'Friday': 'FRI',
    'Saturday': 'SAT',
    'Sunday': 'SUN'
};

// Shorten location names for display
function shortenLocation(name) {
    return name.replace(/boulderbar/gi, 'BB');
}

const App = {
    // Current user
    currentUser: null,

    // Current screen
    currentScreen: 'vote',

    // Data
    members: [],
    locations: [],
    weekdays: [],
    votes: [],
    stats: null,

    // User's current selections
    selectedDays: [],
    selectedLocations: [],

    // Edit mode state
    editMode: {
        type: null,
        action: null,
        oldValue: null
    },

    // Toast timeout
    toastTimeout: null,

    /**
     * Initialize the app
     */
    async init() {
        console.log('Boulder 2.0 initializing...');

        // Check for saved user
        this.currentUser = Storage.getUser();

        // Load initial data
        await this.loadConfig();
        await this.loadVotes();

        // Set up event listeners
        this.setupEventListeners();

        // Update user display
        this.updateUserDisplay();

        // Check for weekly reset notification
        this.checkWeeklyReset();

        // Start countdown timer
        this.updateResetCountdown();
        setInterval(() => this.updateResetCountdown(), 60000); // Update every minute

        console.log('Boulder 2.0 ready!');
    },

    /**
     * Check if voting was reset this week and notify user
     */
    checkWeeklyReset() {
        const lastWeek = localStorage.getItem('boulder_last_week');
        const currentWeek = this.getCurrentWeekKey();

        if (lastWeek && lastWeek !== currentWeek) {
            // New week detected - show reset notification
            this.showToast('New week! Voting has been reset.');

            // Clear user's previous selections from memory
            if (this.currentUser) {
                const userVote = this.votes.find(v => v.name === this.currentUser);
                if (!userVote || (userVote.weekdays.length === 0 && userVote.locations.length === 0)) {
                    this.selectedDays = [];
                    this.selectedLocations = [];
                    this.renderPolls();
                    this.updateVoteSummary();
                }
            }
        }

        localStorage.setItem('boulder_last_week', currentWeek);
    },

    /**
     * Get current week key (year-week)
     */
    getCurrentWeekKey() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 604800000;
        const weekNum = Math.ceil((diff + start.getDay() * 86400000) / oneWeek);
        return `${now.getFullYear()}-${weekNum}`;
    },

    /**
     * Update reset countdown display
     */
    updateResetCountdown() {
        const countdownEl = document.getElementById('reset-countdown');
        if (!countdownEl) return;

        const now = new Date();

        // Find next Sunday at 00:00 (week reset)
        const nextSunday = new Date(now);
        const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
        nextSunday.setDate(now.getDate() + daysUntilSunday);
        nextSunday.setHours(0, 0, 0, 0);

        const diff = nextSunday - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        let countdownText = '⚠️ Reset in ';
        if (days > 0) {
            countdownText += `${days}d ${hours}h`;
        } else if (hours > 0) {
            countdownText += `${hours}h ${minutes}m`;
        } else {
            countdownText += `${minutes}m`;
        }

        countdownEl.textContent = countdownText;
    },

    /**
     * Load configuration (members, locations, weekdays)
     */
    async loadConfig() {
        try {
            const config = await API.getConfig();
            this.members = config.members || [];
            this.locations = config.locations || [];
            this.weekdays = config.weekdays || MockData.weekdays;
            this.populateUserSelect();
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    },

    /**
     * Load current votes
     */
    async loadVotes() {
        try {
            this.showLoading(true);
            const result = await API.getVotes();
            this.votes = result.data || [];

            // Update week number display
            const weekNum = result.weekNumber || MockData.weekNumber;
            document.getElementById('week-number').textContent = `Week ${weekNum}`;

            // Load user's current vote
            if (this.currentUser) {
                const userVote = this.votes.find(v => v.name === this.currentUser);
                if (userVote) {
                    this.selectedDays = [...userVote.weekdays];
                    this.selectedLocations = [...userVote.locations];
                } else {
                    this.selectedDays = [];
                    this.selectedLocations = [];
                }
            }

            this.renderPolls();
            this.updateVoteSummary();
            this.updateFavoritesSummary();
        } catch (error) {
            console.error('Failed to load votes:', error);
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Load statistics
     */
    async loadStats() {
        try {
            this.showLoading(true);
            const result = await API.getStats();
            this.stats = result.data;
            this.renderStats();
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Populate user select dropdown
     */
    populateUserSelect() {
        const select = document.getElementById('user-select');
        select.innerHTML = '<option value="">Select name...</option>';

        this.members.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });

        // Restore selection
        if (this.currentUser) {
            select.value = this.currentUser;
        }
    },

    /**
     * Update user display (selection dropdown vs current user info)
     */
    updateUserDisplay() {
        const selectionDiv = document.getElementById('user-selection');
        const currentUserDiv = document.getElementById('current-user-display');
        const currentUserName = document.getElementById('current-user-name');

        if (this.currentUser) {
            // Show current user display
            selectionDiv.classList.add('hidden');
            currentUserDiv.classList.remove('hidden');
            currentUserName.textContent = this.currentUser;
        } else {
            // Show selection dropdown
            selectionDiv.classList.remove('hidden');
            currentUserDiv.classList.add('hidden');
        }
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // User selection change
        document.getElementById('user-select').addEventListener('change', (e) => {
            const name = e.target.value;
            if (name) {
                this.currentUser = name;
                Storage.saveUser(name);
                this.updateUserDisplay();
                this.loadVotes();
            } else {
                this.currentUser = null;
                Storage.clearUser();
                this.selectedDays = [];
                this.selectedLocations = [];
                this.renderPolls();
                this.updateVoteSummary();
                this.updateUserDisplay();
            }
        });

        // Change user button
        document.getElementById('btn-change-user').addEventListener('click', () => {
            this.currentUser = null;
            Storage.clearUser();
            this.selectedDays = [];
            this.selectedLocations = [];
            document.getElementById('user-select').value = '';
            this.updateUserDisplay();
            this.renderPolls();
            this.updateVoteSummary();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.showScreen(screen);
            });
        });

        // Clear votes button
        document.getElementById('btn-clear-votes').addEventListener('click', () => {
            this.clearVotes();
        });

        // Settings: Add member
        document.getElementById('btn-add-member').addEventListener('click', () => {
            this.openEditModal('member', 'add');
        });

        // Settings: Add location
        document.getElementById('btn-add-location').addEventListener('click', () => {
            this.openEditModal('location', 'add');
        });

        // Modal: Cancel
        document.getElementById('btn-modal-cancel').addEventListener('click', () => {
            this.closeModal('modal-edit');
        });

        // Modal: Save
        document.getElementById('btn-modal-save').addEventListener('click', () => {
            this.saveEdit();
        });

        // Delete Modal: Cancel
        document.getElementById('btn-delete-cancel').addEventListener('click', () => {
            this.closeModal('modal-delete');
        });

        // Delete Modal: Confirm
        document.getElementById('btn-delete-confirm').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Modal backdrop click to close
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                this.closeModal('modal-edit');
                this.closeModal('modal-delete');
            });
        });

        // Share button
        document.getElementById('btn-share').addEventListener('click', () => {
            this.shareLeading();
        });

        // Enter key in modal input
        document.getElementById('modal-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveEdit();
            }
        });
    },

    /**
     * Show a specific screen
     */
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenName);
        });

        // Load data for specific screens
        if (screenName === 'stats' && !this.stats) {
            this.loadStats();
        } else if (screenName === 'settings') {
            this.renderSettings();
        }
    },

    /**
     * Get dates for the upcoming week (next Monday to Friday)
     */
    getWeekDates() {
        const dates = {};
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...

        // Find next Monday
        let daysUntilMonday = (8 - dayOfWeek) % 7;
        if (daysUntilMonday === 0 && dayOfWeek !== 1) daysUntilMonday = 7;
        if (dayOfWeek === 0) daysUntilMonday = 1; // If Sunday, Monday is tomorrow
        if (dayOfWeek >= 1 && dayOfWeek <= 5) daysUntilMonday = 1 - dayOfWeek; // Current week

        // If it's still this week (Mon-Fri), show this week's dates
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            daysUntilMonday = 1 - dayOfWeek;
        }

        const monday = new Date(today);
        monday.setDate(today.getDate() + daysUntilMonday);

        const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        weekdayOrder.forEach((day, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            dates[day] = `${date.getDate()}.${date.getMonth() + 1}.`;
        });

        return dates;
    },

    /**
     * Render the polls
     */
    renderPolls() {
        this.renderWeekdayPoll();
        this.renderLocationPoll();
    },

    /**
     * Render weekday poll with dates
     */
    renderWeekdayPoll() {
        const container = document.getElementById('weekday-poll');
        container.innerHTML = '';

        const weekDates = this.getWeekDates();

        this.weekdays.forEach(day => {
            const voters = this.getVotersForDay(day);
            const isSelected = this.selectedDays.includes(day);
            const maxVotes = Math.max(...this.weekdays.map(d => this.getVotersForDay(d).length), 1);
            const germanDay = WEEKDAY_NAMES[day] || day;
            const dateStr = weekDates[day] || '';

            container.appendChild(this.createPollOption(day, germanDay, dateStr, voters, isSelected, maxVotes, 'day'));
        });
    },

    /**
     * Render location poll
     */
    renderLocationPoll() {
        const container = document.getElementById('location-poll');
        container.innerHTML = '';

        this.locations.forEach(location => {
            const voters = this.getVotersForLocation(location);
            const isSelected = this.selectedLocations.includes(location);
            const maxVotes = Math.max(...this.locations.map(l => this.getVotersForLocation(l).length), 1);

            container.appendChild(this.createPollOption(location, location, '', voters, isSelected, maxVotes, 'location'));
        });
    },

    /**
     * Create a poll option element
     */
    createPollOption(value, label, dateStr, voters, isSelected, maxVotes, type) {
        const div = document.createElement('div');
        div.className = `poll-option ${isSelected ? 'selected' : ''}`;
        if (!this.currentUser) {
            div.className += ' disabled';
        }
        div.dataset.value = value;
        div.dataset.type = type;

        const voteCount = voters.length;
        const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        // Replace current user name with "You"
        const displayVoters = voters.map(v => v === this.currentUser ? 'You' : v);

        const dateHtml = dateStr ? `<span class="poll-date">${dateStr}</span>` : '';

        div.innerHTML = `
            <div class="poll-option-header">
                <span class="poll-checkbox">${isSelected ? '☑' : '☐'}</span>
                <span class="poll-label">${label} ${dateHtml}</span>
                <span class="poll-count">${voteCount}</span>
            </div>
            <div class="poll-progress">
                <div class="poll-progress-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="poll-voters">${displayVoters.join(', ') || ''}</div>
        `;

        div.addEventListener('click', () => {
            if (!this.currentUser) {
                this.showToast('Please select your name first!');
                document.getElementById('user-select').focus();
                return;
            }
            this.toggleVote(type, value);
        });

        return div;
    },

    /**
     * Get voters for a specific day
     */
    getVotersForDay(day) {
        return this.votes
            .filter(v => v.weekdays && v.weekdays.includes(day))
            .map(v => v.name);
    },

    /**
     * Get voters for a specific location
     */
    getVotersForLocation(location) {
        return this.votes
            .filter(v => v.locations && v.locations.includes(location))
            .map(v => v.name);
    },

    /**
     * Toggle a vote
     */
    async toggleVote(type, value) {
        if (type === 'day') {
            const index = this.selectedDays.indexOf(value);
            if (index === -1) {
                this.selectedDays.push(value);
            } else {
                this.selectedDays.splice(index, 1);
            }
        } else {
            const index = this.selectedLocations.indexOf(value);
            if (index === -1) {
                this.selectedLocations.push(value);
            } else {
                this.selectedLocations.splice(index, 1);
            }
        }

        // Update local votes array immediately for instant UI update
        this.updateLocalVote();

        // Update UI immediately
        this.renderPolls();
        this.updateVoteSummary();
        this.updateFavoritesSummary();

        // Sync with backend
        await this.syncVote();
    },

    /**
     * Update local votes array for immediate UI feedback
     */
    updateLocalVote() {
        if (!this.currentUser) return;

        const existingIndex = this.votes.findIndex(v => v.name === this.currentUser);

        if (this.selectedDays.length === 0 && this.selectedLocations.length === 0) {
            // Remove vote if empty
            if (existingIndex !== -1) {
                this.votes.splice(existingIndex, 1);
            }
        } else {
            const newVote = {
                name: this.currentUser,
                weekdays: [...this.selectedDays],
                locations: [...this.selectedLocations]
            };
            if (existingIndex !== -1) {
                this.votes[existingIndex] = newVote;
            } else {
                this.votes.push(newVote);
            }
        }
    },

    /**
     * Sync vote with backend
     */
    async syncVote() {
        try {
            if (this.selectedDays.length === 0 && this.selectedLocations.length === 0) {
                await API.removeVote(this.currentUser);
                this.votes = this.votes.filter(v => v.name !== this.currentUser);
            } else {
                await API.vote(this.currentUser, this.selectedDays, this.selectedLocations);
                const existingIndex = this.votes.findIndex(v => v.name === this.currentUser);
                const newVote = {
                    name: this.currentUser,
                    weekdays: [...this.selectedDays],
                    locations: [...this.selectedLocations]
                };
                if (existingIndex !== -1) {
                    this.votes[existingIndex] = newVote;
                } else {
                    this.votes.push(newVote);
                }
            }
        } catch (error) {
            console.error('Failed to sync vote:', error);
        }
    },

    /**
     * Clear all votes
     */
    async clearVotes() {
        this.selectedDays = [];
        this.selectedLocations = [];
        this.renderPolls();
        this.updateVoteSummary();
        this.updateFavoritesSummary();
        await this.syncVote();
        this.showToast('Selection cleared');
    },

    /**
     * Update vote summary display
     */
    updateVoteSummary() {
        const summary = document.getElementById('vote-summary');
        const daysEl = document.getElementById('summary-days');
        const locsEl = document.getElementById('summary-locations');

        if (this.selectedDays.length === 0 && this.selectedLocations.length === 0) {
            summary.classList.add('hidden');
        } else {
            summary.classList.remove('hidden');
            const dayNames = this.selectedDays.map(d => WEEKDAY_NAMES[d] || d);
            daysEl.textContent = dayNames.join(', ') || 'No days selected';
            locsEl.textContent = this.selectedLocations.join(', ') || 'No location selected';
        }
    },

    /**
     * Update favorites summary (current leader)
     */
    updateFavoritesSummary() {
        const summaryEl = document.getElementById('favorites-summary');
        const favDayEl = document.getElementById('favorite-day');
        const favLocEl = document.getElementById('favorite-location');
        const leadingVotersEl = document.getElementById('leading-voters');

        // Get week dates for display
        const weekDates = this.getWeekDates();

        // Count votes per day
        const dayCounts = {};
        this.weekdays.forEach(day => {
            dayCounts[day] = this.getVotersForDay(day).length;
        });

        // Count votes per location
        const locCounts = {};
        this.locations.forEach(loc => {
            locCounts[loc] = this.getVotersForLocation(loc).length;
        });

        // Find max vote counts
        const maxDayVotes = Math.max(...Object.values(dayCounts), 0);
        const maxLocVotes = Math.max(...Object.values(locCounts), 0);

        // Find all days with max votes (tied leaders)
        const topDays = Object.entries(dayCounts)
            .filter(([_, count]) => count === maxDayVotes && count > 0)
            .map(([day, count]) => ({ day, count }));

        // Find all locations with max votes (tied leaders)
        const topLocs = Object.entries(locCounts)
            .filter(([_, count]) => count === maxLocVotes && count > 0)
            .map(([loc, count]) => ({ loc, count }));

        if (topDays.length > 0 || topLocs.length > 0) {
            summaryEl.classList.remove('hidden');

            if (topDays.length > 0) {
                const dayTexts = topDays.map(({ day }) => {
                    const shortDay = WEEKDAY_SHORT[day] || day;
                    const dateStr = weekDates[day] || '';
                    return `${shortDay} ${dateStr}`;
                });
                favDayEl.textContent = `${dayTexts.join(' / ')} (${maxDayVotes})`;

                // Show who voted for the leading day(s)
                const leadingDayVoters = new Set();
                topDays.forEach(({ day }) => {
                    this.getVotersForDay(day).forEach(voter => leadingDayVoters.add(voter));
                });
                const voterNames = Array.from(leadingDayVoters)
                    .map(v => v === this.currentUser ? 'You' : v)
                    .join(', ');
                leadingVotersEl.innerHTML = `<strong>Going:</strong> ${voterNames}`;
            } else {
                favDayEl.textContent = '-';
                leadingVotersEl.innerHTML = '';
            }

            if (topLocs.length > 0) {
                const locTexts = topLocs.map(({ loc }) => shortenLocation(loc));
                favLocEl.textContent = `${locTexts.join(' / ')} (${maxLocVotes})`;
            } else {
                favLocEl.textContent = '-';
            }
        } else {
            summaryEl.classList.add('hidden');
        }
    },

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.getElementById('toast');
        const messageEl = document.getElementById('toast-message');

        // Clear existing timeout
        if (this.toastTimeout) {
            clearTimeout(this.toastTimeout);
        }

        messageEl.textContent = message;
        toast.classList.remove('hidden');

        this.toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    },

    /**
     * Share leading day/location to Messenger or clipboard
     */
    async shareLeading() {
        const weekDates = this.getWeekDates();

        // Get leading day info
        const dayCounts = {};
        this.weekdays.forEach(day => {
            dayCounts[day] = this.getVotersForDay(day).length;
        });
        const maxDayVotes = Math.max(...Object.values(dayCounts), 0);
        const topDays = Object.entries(dayCounts)
            .filter(([_, count]) => count === maxDayVotes && count > 0);

        // Get leading location info
        const locCounts = {};
        this.locations.forEach(loc => {
            locCounts[loc] = this.getVotersForLocation(loc).length;
        });
        const maxLocVotes = Math.max(...Object.values(locCounts), 0);
        const topLocs = Object.entries(locCounts)
            .filter(([_, count]) => count === maxLocVotes && count > 0);

        // Build compact message
        let message = '🧗 ';

        // Day + Time
        if (topDays.length > 0) {
            const dayTexts = topDays.map(([day]) => {
                const shortDay = WEEKDAY_SHORT[day] || day;
                const dateStr = weekDates[day] || '';
                return `${shortDay} ${dateStr}`;
            });
            message += `${dayTexts.join('/')} 18:30`;
        }

        // Location
        if (topLocs.length > 0) {
            const locTexts = topLocs.map(([loc]) => shortenLocation(loc));
            message += ` @ ${locTexts.join('/')}`;
        }

        // Voters
        if (topDays.length > 0) {
            const voters = new Set();
            topDays.forEach(([day]) => {
                this.getVotersForDay(day).forEach(v => voters.add(v));
            });
            message += `\n👥 ${Array.from(voters).join(', ')}`;
        }

        // Try native share API first (works on mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Boulder 2.0',
                    text: message
                });
                return;
            } catch (err) {
                // User cancelled or error, fall back to clipboard
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(message);
            this.showToast('Copied to clipboard!');
        } catch (err) {
            // Final fallback: show message in prompt
            prompt('Copy this message:', message);
        }
    },

    /**
     * Render statistics
     */
    renderStats() {
        if (!this.stats) return;

        // Top Climbers
        const climbersContainer = document.getElementById('top-climbers');
        climbersContainer.innerHTML = '';

        const maxClimberCount = this.stats.topClimbers[0]?.count || 1;

        this.stats.topClimbers.forEach((climber, index) => {
            const percentage = (climber.count / maxClimberCount) * 100;
            const div = document.createElement('div');
            div.className = 'stats-item';
            div.innerHTML = `
                <div class="stats-item-header">
                    <span class="stats-rank">${index + 1}.</span>
                    <span class="stats-name">${climber.name}</span>
                    <span class="stats-count">${climber.count}</span>
                </div>
                <div class="stats-bar">
                    <div class="stats-bar-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            climbersContainer.appendChild(div);
        });

        // Top Locations
        const locationsContainer = document.getElementById('top-locations');
        locationsContainer.innerHTML = '';

        const maxLocationCount = this.stats.topLocations[0]?.count || 1;

        this.stats.topLocations.forEach((location, index) => {
            const percentage = (location.count / maxLocationCount) * 100;
            const div = document.createElement('div');
            div.className = 'stats-item';
            div.innerHTML = `
                <div class="stats-item-header">
                    <span class="stats-rank">${index + 1}.</span>
                    <span class="stats-name">${location.name}</span>
                    <span class="stats-count">${location.count}</span>
                </div>
                <div class="stats-bar">
                    <div class="stats-bar-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            locationsContainer.appendChild(div);
        });
    },

    /**
     * Render settings
     */
    renderSettings() {
        this.renderMembersList();
        this.renderLocationsList();
    },

    /**
     * Render members list in settings
     */
    renderMembersList() {
        const container = document.getElementById('members-list');
        container.innerHTML = '';

        this.members.forEach(member => {
            const div = document.createElement('div');
            div.className = 'settings-item';
            div.innerHTML = `
                <span class="settings-item-name">${member}</span>
                <div class="settings-item-actions">
                    <button class="btn-icon btn-edit" data-name="${member}" data-type="member">✏️</button>
                    <button class="btn-icon btn-delete" data-name="${member}" data-type="member">🗑️</button>
                </div>
            `;

            div.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal('member', 'edit', member);
            });

            div.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openDeleteModal('member', member);
            });

            container.appendChild(div);
        });
    },

    /**
     * Render locations list in settings
     */
    renderLocationsList() {
        const container = document.getElementById('locations-list');
        container.innerHTML = '';

        this.locations.forEach(location => {
            const div = document.createElement('div');
            div.className = 'settings-item';
            div.innerHTML = `
                <span class="settings-item-name">${location}</span>
                <div class="settings-item-actions">
                    <button class="btn-icon btn-edit" data-name="${location}" data-type="location">✏️</button>
                    <button class="btn-icon btn-delete" data-name="${location}" data-type="location">🗑️</button>
                </div>
            `;

            div.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal('location', 'edit', location);
            });

            div.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openDeleteModal('location', location);
            });

            container.appendChild(div);
        });
    },

    /**
     * Open edit modal
     */
    openEditModal(type, action, oldValue = null) {
        this.editMode = { type, action, oldValue };

        const modal = document.getElementById('modal-edit');
        const title = document.getElementById('modal-title');
        const input = document.getElementById('modal-input');

        if (action === 'add') {
            title.textContent = type === 'member' ? 'Add Member' : 'Add Location';
            input.value = '';
            input.placeholder = type === 'member' ? 'Enter name' : 'Enter location';
        } else {
            title.textContent = type === 'member' ? 'Edit Member' : 'Edit Location';
            input.value = oldValue || '';
        }

        modal.classList.remove('hidden');
        input.focus();
    },

    /**
     * Open delete confirmation modal
     */
    openDeleteModal(type, name) {
        this.editMode = { type, action: 'delete', oldValue: name };

        const modal = document.getElementById('modal-delete');
        const message = document.getElementById('delete-message');

        if (type === 'member') {
            message.textContent = `Delete "${name}"? Their votes will also be removed.`;
        } else {
            message.textContent = `Delete "${name}"?`;
        }

        modal.classList.remove('hidden');
    },

    /**
     * Close a modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        this.editMode = { type: null, action: null, oldValue: null };
    },

    /**
     * Save edit from modal
     */
    async saveEdit() {
        const input = document.getElementById('modal-input');
        const newValue = input.value.trim();

        if (!newValue) {
            this.showToast('Please enter a value');
            return;
        }

        const { type, action, oldValue } = this.editMode;

        try {
            this.showLoading(true);

            if (type === 'member') {
                if (action === 'add') {
                    await API.addMember(newValue);
                    this.members.push(newValue);
                    this.members.sort((a, b) => a.localeCompare(b));
                } else if (action === 'edit') {
                    await API.renameMember(oldValue, newValue);
                    const index = this.members.indexOf(oldValue);
                    if (index !== -1) {
                        this.members[index] = newValue;
                        this.members.sort((a, b) => a.localeCompare(b));
                    }
                    if (this.currentUser === oldValue) {
                        this.currentUser = newValue;
                        Storage.saveUser(newValue);
                    }
                }
            } else if (type === 'location') {
                if (action === 'add') {
                    await API.addLocation(newValue);
                    this.locations.push(newValue);
                    this.locations.sort((a, b) => a.localeCompare(b));
                } else if (action === 'edit') {
                    await API.renameLocation(oldValue, newValue);
                    const index = this.locations.indexOf(oldValue);
                    if (index !== -1) {
                        this.locations[index] = newValue;
                        this.locations.sort((a, b) => a.localeCompare(b));
                    }
                }
            }

            this.closeModal('modal-edit');
            this.renderSettings();
            this.populateUserSelect();
            this.showToast('Saved!');
        } catch (error) {
            console.error('Failed to save:', error);
            this.showToast('Error saving');
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Confirm delete
     */
    async confirmDelete() {
        const { type, oldValue } = this.editMode;

        try {
            this.showLoading(true);

            if (type === 'member') {
                await API.removeMember(oldValue);
                this.members = this.members.filter(m => m !== oldValue);
                this.votes = this.votes.filter(v => v.name !== oldValue);

                if (this.currentUser === oldValue) {
                    Storage.clearUser();
                    this.currentUser = null;
                    document.getElementById('user-select').value = '';
                }
            } else if (type === 'location') {
                await API.removeLocation(oldValue);
                this.locations = this.locations.filter(l => l !== oldValue);
                this.votes.forEach(v => {
                    v.locations = v.locations.filter(l => l !== oldValue);
                });
                this.selectedLocations = this.selectedLocations.filter(l => l !== oldValue);
            }

            this.closeModal('modal-delete');
            this.renderSettings();
            this.populateUserSelect();
            this.renderPolls();
            this.updateFavoritesSummary();
            this.showToast('Deleted!');
        } catch (error) {
            console.error('Failed to delete:', error);
            this.showToast('Error deleting');
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
};

// Force fresh data and service worker update on every page load
function forceRefresh() {
    // Clear service worker cache
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }

    // Force service worker to update
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
                reg.update();
                if (reg.waiting) {
                    reg.waiting.postMessage('skipWaiting');
                }
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    forceRefresh();
    App.init();
});
