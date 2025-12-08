/**
 * Boulder 2.0 - Local Storage Module
 * Handles saving/loading user data and caching
 */

const Storage = {
    KEYS: {
        USER: 'boulder_user',
        VOTES_CACHE: 'boulder_votes_cache',
        MEMBERS_CACHE: 'boulder_members_cache',
        LOCATIONS_CACHE: 'boulder_locations_cache',
        STATS_CACHE: 'boulder_stats_cache'
    },

    /**
     * Save the current user's name
     */
    saveUser(name) {
        localStorage.setItem(this.KEYS.USER, name);
    },

    /**
     * Get the saved user's name
     */
    getUser() {
        return localStorage.getItem(this.KEYS.USER) || null;
    },

    /**
     * Clear the saved user
     */
    clearUser() {
        localStorage.removeItem(this.KEYS.USER);
    },

    /**
     * Cache votes for offline use
     */
    cacheVotes(votes) {
        localStorage.setItem(this.KEYS.VOTES_CACHE, JSON.stringify({
            data: votes,
            timestamp: Date.now()
        }));
    },

    /**
     * Get cached votes
     */
    getCachedVotes() {
        const cached = localStorage.getItem(this.KEYS.VOTES_CACHE);
        if (!cached) return null;

        try {
            return JSON.parse(cached);
        } catch (e) {
            return null;
        }
    },

    /**
     * Cache members list
     */
    cacheMembers(members) {
        localStorage.setItem(this.KEYS.MEMBERS_CACHE, JSON.stringify({
            data: members,
            timestamp: Date.now()
        }));
    },

    /**
     * Get cached members
     */
    getCachedMembers() {
        const cached = localStorage.getItem(this.KEYS.MEMBERS_CACHE);
        if (!cached) return null;

        try {
            return JSON.parse(cached);
        } catch (e) {
            return null;
        }
    },

    /**
     * Cache locations list
     */
    cacheLocations(locations) {
        localStorage.setItem(this.KEYS.LOCATIONS_CACHE, JSON.stringify({
            data: locations,
            timestamp: Date.now()
        }));
    },

    /**
     * Get cached locations
     */
    getCachedLocations() {
        const cached = localStorage.getItem(this.KEYS.LOCATIONS_CACHE);
        if (!cached) return null;

        try {
            return JSON.parse(cached);
        } catch (e) {
            return null;
        }
    },

    /**
     * Cache statistics
     */
    cacheStats(stats) {
        localStorage.setItem(this.KEYS.STATS_CACHE, JSON.stringify({
            data: stats,
            timestamp: Date.now()
        }));
    },

    /**
     * Get cached statistics
     */
    getCachedStats() {
        const cached = localStorage.getItem(this.KEYS.STATS_CACHE);
        if (!cached) return null;

        try {
            return JSON.parse(cached);
        } catch (e) {
            return null;
        }
    },

    /**
     * Clear all cached data
     */
    clearAllCache() {
        Object.values(this.KEYS).forEach(key => {
            if (key !== this.KEYS.USER) {
                localStorage.removeItem(key);
            }
        });
    }
};
