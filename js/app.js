/**
 * Boulder 2.0 - Main Application
 */

const App = {
    // Current user
    currentUser: null,

    // Current screen
    currentScreen: 'welcome',

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
        type: null, // 'member' or 'location'
        action: null, // 'add', 'edit', 'delete'
        oldValue: null
    },

    /**
     * Initialize the app
     */
    async init() {
        console.log('Boulder 2.0 initializing...');

        // Check for saved user
        this.currentUser = Storage.getUser();

        // Load initial data
        await this.loadConfig();

        // Set up event listeners
        this.setupEventListeners();

        // Show appropriate screen
        if (this.currentUser) {
            this.showScreen('vote');
            await this.loadVotes();
        } else {
            this.showScreen('welcome');
        }

        console.log('Boulder 2.0 ready!');
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
        select.innerHTML = '<option value="">Select your name</option>';

        this.members.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // User selection
        document.getElementById('user-select').addEventListener('change', (e) => {
            const btn = document.getElementById('btn-continue');
            btn.disabled = !e.target.value;
        });

        // Continue button
        document.getElementById('btn-continue').addEventListener('click', () => {
            const name = document.getElementById('user-select').value;
            if (name) {
                this.currentUser = name;
                Storage.saveUser(name);
                this.showScreen('vote');
                this.loadVotes();
            }
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

        // Settings: Change user
        document.getElementById('btn-change-user').addEventListener('click', () => {
            Storage.clearUser();
            this.currentUser = null;
            this.showScreen('welcome');
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
        } else if (screenName === 'vote') {
            document.getElementById('current-user-display').textContent = this.currentUser || '';
        }
    },

    /**
     * Render the polls
     */
    renderPolls() {
        this.renderWeekdayPoll();
        this.renderLocationPoll();
    },

    /**
     * Render weekday poll
     */
    renderWeekdayPoll() {
        const container = document.getElementById('weekday-poll');
        container.innerHTML = '';

        this.weekdays.forEach(day => {
            const voters = this.getVotersForDay(day);
            const isSelected = this.selectedDays.includes(day);
            const maxVotes = Math.max(...this.weekdays.map(d => this.getVotersForDay(d).length), 1);

            container.appendChild(this.createPollOption(day, voters, isSelected, maxVotes, 'day'));
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

            container.appendChild(this.createPollOption(location, voters, isSelected, maxVotes, 'location'));
        });
    },

    /**
     * Create a poll option element
     */
    createPollOption(label, voters, isSelected, maxVotes, type) {
        const div = document.createElement('div');
        div.className = `poll-option ${isSelected ? 'selected' : ''}`;
        div.dataset.value = label;
        div.dataset.type = type;

        const voteCount = voters.length;
        const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        // Replace current user name with "You"
        const displayVoters = voters.map(v => v === this.currentUser ? 'You' : v);

        div.innerHTML = `
            <div class="poll-option-header">
                <span class="poll-checkbox">${isSelected ? '☑' : '☐'}</span>
                <span class="poll-label">${label}</span>
                <span class="poll-count">${voteCount}</span>
            </div>
            <div class="poll-progress">
                <div class="poll-progress-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="poll-voters">${displayVoters.join(', ') || ''}</div>
        `;

        div.addEventListener('click', () => {
            this.toggleVote(type, label);
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

        // Update UI immediately
        this.renderPolls();
        this.updateVoteSummary();

        // Sync with backend
        await this.syncVote();
    },

    /**
     * Sync vote with backend
     */
    async syncVote() {
        try {
            if (this.selectedDays.length === 0 && this.selectedLocations.length === 0) {
                await API.removeVote(this.currentUser);
                // Remove from local votes
                this.votes = this.votes.filter(v => v.name !== this.currentUser);
            } else {
                await API.vote(this.currentUser, this.selectedDays, this.selectedLocations);
                // Update local votes
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
        await this.syncVote();
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
            daysEl.textContent = this.selectedDays.join(', ') || 'No days selected';
            locsEl.textContent = this.selectedLocations.join(', ') || 'No locations selected';
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
        document.getElementById('current-user-display').textContent = this.currentUser || '';
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

            // Edit button
            div.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal('member', 'edit', member);
            });

            // Delete button
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

            // Edit button
            div.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditModal('location', 'edit', location);
            });

            // Delete button
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
            title.textContent = `Add ${type === 'member' ? 'Member' : 'Location'}`;
            input.value = '';
            input.placeholder = `Enter ${type === 'member' ? 'name' : 'location'}`;
        } else {
            title.textContent = `Edit ${type === 'member' ? 'Member' : 'Location'}`;
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
            message.textContent = `Delete "${name}"? This will also remove their votes.`;
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
            alert('Please enter a value');
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
                    // Update current user if renamed
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
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save. Please try again.');
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

                // If deleted current user, log out
                if (this.currentUser === oldValue) {
                    Storage.clearUser();
                    this.currentUser = null;
                    this.closeModal('modal-delete');
                    this.showScreen('welcome');
                    this.populateUserSelect();
                    return;
                }
            } else if (type === 'location') {
                await API.removeLocation(oldValue);
                this.locations = this.locations.filter(l => l !== oldValue);
                // Remove from votes
                this.votes.forEach(v => {
                    v.locations = v.locations.filter(l => l !== oldValue);
                });
                // Remove from user's selection
                this.selectedLocations = this.selectedLocations.filter(l => l !== oldValue);
            }

            this.closeModal('modal-delete');
            this.renderSettings();
            this.populateUserSelect();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete. Please try again.');
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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
