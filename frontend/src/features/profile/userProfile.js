/**
 * @fileoverview User Profile Service
 * 
 * Centralized service for managing user profile state across the application.
 * Provides real-time updates when profile changes.
 */

class UserProfileService {
    constructor() {
        this.currentProfile = null;
        this.listeners = new Set();
    }

    /**
     * Set the current user profile
     * @param {Object} profile - User profile data
     */
    setProfile(profile) {
        this.currentProfile = profile;
        this.notifyListeners();
    }

    /**
     * Get the current user profile
     * @returns {Object|null} Current profile
     */
    getProfile() {
        return this.currentProfile;
    }

    /**
     * Update profile (e.g., after editing)
     * @param {Object} updates - Profile updates
     */
    updateProfile(updates) {
        this.currentProfile = { ...this.currentProfile, ...updates };
        this.notifyListeners();
        
        // Dispatch global event
        window.dispatchEvent(new CustomEvent('musicare:profile-updated', {
            detail: this.currentProfile
        }));
    }

    /**
     * Add a listener for profile changes
     * @param {Function} callback - Function to call when profile changes
     */
    addListener(callback) {
        this.listeners.add(callback);
    }

    /**
     * Remove a listener
     * @param {Function} callback - Listener to remove
     */
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of profile change
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.currentProfile);
            } catch (error) {
                console.error('Error in profile listener:', error);
            }
        });
    }

    /**
     * Get display name (username > displayName > email > fallback)
     */
    getDisplayName() {
        if (!this.currentProfile) return 'User';
        
        return this.currentProfile?.username || 
               this.currentProfile?.displayName || 
               this.currentProfile?.email?.split('@')[0] || 
               'User';
    }

    /**
     * Get masked display name for sidebar
     */
    getMaskedDisplayName() {
        const displayName = this.getDisplayName();
        return displayName.length > 8
            ? displayName.slice(0, 7) + "***"
            : displayName;
    }
}

// Create singleton instance
const userProfileService = new UserProfileService();

export default userProfileService;