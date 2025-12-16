/**
 * Boulder 2.0 - API Module
 * Handles communication with PostgreSQL backend
 */

const API = {
    // Backend URL - aus config.js (wird bei Docker-Builds ueberschrieben)
    get BASE_URL() {
        return window.BOULDER_CONFIG?.apiUrl || 'https://boulder-api.varga.media';
    },

    /**
     * Check if we should use mock data
     */
    useMock() {
        return MOCK_MODE || !this.BASE_URL;
    },

    /**
     * Get votes for a specific week (or current week if not specified)
     */
    async getVotes(weekStr = null) {
        if (this.useMock()) {
            await this.delay(300);
            return {
                success: true,
                data: MockData.votes,
                weekNumber: MockData.weekNumber,
                isCurrentWeek: true,
                currentWeekNumber: `2025-${MockData.weekNumber}`
            };
        }

        try {
            const url = weekStr
                ? `${this.BASE_URL}/api/votes?week=${weekStr}`
                : `${this.BASE_URL}/api/votes`;
            const response = await fetch(url);
            const data = await response.json();
            if (!weekStr) {
                Storage.cacheVotes(data);
            }
            return data;
        } catch (error) {
            console.error('Error fetching votes:', error);
            const cached = Storage.getCachedVotes();
            if (cached) {
                return { success: true, data: cached.data, cached: true };
            }
            throw error;
        }
    },

    /**
     * Get list of weeks with votes
     */
    async getWeeks() {
        if (this.useMock()) {
            await this.delay(200);
            return {
                success: true,
                weeks: [`2025-${MockData.weekNumber}`],
                currentWeek: `2025-${MockData.weekNumber}`
            };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/weeks`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching weeks:', error);
            return { success: false, weeks: [], currentWeek: null };
        }
    },

    /**
     * Get configuration (members, locations, weekdays)
     */
    async getConfig() {
        if (this.useMock()) {
            await this.delay(200);
            return {
                success: true,
                members: MockData.members,
                locations: MockData.locations,
                weekdays: MockData.weekdays
            };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/config`);
            const data = await response.json();
            Storage.cacheMembers(data.members);
            Storage.cacheLocations(data.locations);
            return data;
        } catch (error) {
            console.error('Error fetching config:', error);
            const cachedMembers = Storage.getCachedMembers();
            const cachedLocations = Storage.getCachedLocations();
            if (cachedMembers && cachedLocations) {
                return {
                    success: true,
                    members: cachedMembers.data,
                    locations: cachedLocations.data,
                    weekdays: MockData.weekdays,
                    cached: true
                };
            }
            throw error;
        }
    },

    /**
     * Get statistics
     */
    async getStats() {
        if (this.useMock()) {
            await this.delay(300);
            return {
                success: true,
                data: MockData.stats
            };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/stats`);
            const data = await response.json();
            Storage.cacheStats(data);
            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            const cached = Storage.getCachedStats();
            if (cached) {
                return { success: true, data: cached.data, cached: true };
            }
            throw error;
        }
    },

    /**
     * Submit a vote
     */
    async vote(name, weekdays, locations, weekStr = null) {
        if (this.useMock()) {
            await this.delay(400);
            MockData.setUserVote(name, weekdays, locations);
            return { success: true };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, weekdays, locations, week: weekStr })
            });
            return await response.json();
        } catch (error) {
            console.error('Error submitting vote:', error);
            throw error;
        }
    },

    /**
     * Remove a user's vote
     */
    async removeVote(name, weekStr = null) {
        if (this.useMock()) {
            await this.delay(300);
            MockData.removeUserVote(name);
            return { success: true };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/removeVote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, week: weekStr })
            });
            return await response.json();
        } catch (error) {
            console.error('Error removing vote:', error);
            throw error;
        }
    },

    /**
     * Add a new member
     */
    async addMember(name) {
        if (this.useMock()) {
            await this.delay(300);
            MockData.addMember(name);
            return { success: true, members: MockData.members };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/addMember`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    },

    /**
     * Remove a member (also removes their votes)
     */
    async removeMember(name) {
        if (this.useMock()) {
            await this.delay(300);
            MockData.removeMember(name);
            return { success: true, members: MockData.members };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/removeMember`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            return await response.json();
        } catch (error) {
            console.error('Error removing member:', error);
            throw error;
        }
    },

    /**
     * Rename a member
     */
    async renameMember(oldName, newName) {
        if (this.useMock()) {
            await this.delay(300);
            MockData.renameMember(oldName, newName);
            return { success: true, members: MockData.members };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/renameMember`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName, newName })
            });
            return await response.json();
        } catch (error) {
            console.error('Error renaming member:', error);
            throw error;
        }
    },

    /**
     * Add a new location
     */
    async addLocation(name) {
        if (this.useMock()) {
            await this.delay(300);
            MockData.addLocation(name);
            return { success: true, locations: MockData.locations };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/addLocation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            return await response.json();
        } catch (error) {
            console.error('Error adding location:', error);
            throw error;
        }
    },

    /**
     * Remove a location
     */
    async removeLocation(name) {
        if (this.useMock()) {
            await this.delay(300);
            MockData.removeLocation(name);
            return { success: true, locations: MockData.locations };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/removeLocation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            return await response.json();
        } catch (error) {
            console.error('Error removing location:', error);
            throw error;
        }
    },

    /**
     * Rename a location
     */
    async renameLocation(oldName, newName) {
        if (this.useMock()) {
            await this.delay(300);
            MockData.renameLocation(oldName, newName);
            return { success: true, locations: MockData.locations };
        }

        try {
            const response = await fetch(`${this.BASE_URL}/api/renameLocation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName, newName })
            });
            return await response.json();
        } catch (error) {
            console.error('Error renaming location:', error);
            throw error;
        }
    },

    /**
     * Utility: Simulate network delay for mock mode
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
