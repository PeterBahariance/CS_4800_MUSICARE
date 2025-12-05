/**
 * @fileoverview Profile Settings Module
 *
 * Handles user profile settings and updates for the Musicare application.
 * Allows users to update their username, display name, and other profile settings.
 *
 * Features:
 * - Load user profile data
 * - Update profile settings
 * - Save changes to backend
 * - Display success/error messages
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-12-01
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js - Firebase core
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js - Firebase authentication
 * @requires ../../config/firebase.js - Firebase configuration
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from '../../config/firebase.js';

/**
 * Firebase Application Instance
 *
 * @constant {FirebaseApp} app
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication Service
 *
 * @constant {Auth} auth
 */
const auth = getAuth(app);

/**
 * Profile Settings Class
 *
 * Main class managing all profile functionality including loading,
 * updating, and saving user profile settings.
 *
 * @class ProfileSettings
 */
class ProfileSettings {
    /**
     * Initialize Profile Settings
     *
     * Sets up the profile system with initial state and starts
     * listening for authentication changes.
     *
     * @constructor
     */
    constructor() {
        /**
         * Current authenticated user data from database
         * @type {Object|null}
         */
        this.currentUser = null;

        /**
         * Form state for handling UI updates
         * @type {Object}
         */
        this.formState = {
            isSubmitting: false,
            error: '',
            success: ''
        };

        this.init();
    }

    /**
     * Initialize Profile System
     *
     * Sets up authentication state listener and initializes UI components
     * when user is authenticated.
     *
     * @async
     * @function init
     */
    async init() {
        console.log('👤 ProfileSettings: Initializing...');

        // Wait for auth state to be ready
        auth.onAuthStateChanged(async (user) => {
            console.log('👤 ProfileSettings: Auth state changed', user ? 'User logged in' : 'User logged out');
            if (user) {
                console.log('👤 ProfileSettings: Firebase user:', user.uid);
                this.currentUser = await this.getCurrentUserData(user.uid);
                console.log('👤 ProfileSettings: Current user data:', this.currentUser);

                if (this.currentUser) {
                    this.setupEventListeners();
                    await this.loadProfileData();
                }
            } else {
                this.cleanup();
            }
        });
    }

    /**
     * Get Current User Data
     *
     * Fetches the current user's data from the database using their Firebase UID.
     *
     * @async
     * @function getCurrentUserData
     * @param {string} firebaseUid - Firebase authentication UID
     * @returns {Promise<Object|null>} User data object or null if not found
     */
    async getCurrentUserData(firebaseUid) {
        try {
            console.log('👤 ProfileSettings: Fetching user data for UID:', firebaseUid);
            let response = await fetch(`/api/users?firebaseUid=${firebaseUid}`);

            if (!response.ok) {
                // Fallback: search by email
                const currentUser = auth.currentUser;
                if (currentUser && currentUser.email) {
                    console.log('👤 ProfileSettings: Trying fallback search by email');
                    response = await fetch(`/api/users?email=${encodeURIComponent(currentUser.email)}`);
                    if (response.ok) {
                        const data = await response.json();
                        return data.user || data;
                    }
                }
            }

            const data = await response.json();
            return data.user || data;
        } catch (error) {
            console.error('👤 ProfileSettings: Error fetching user data:', error);
            return null;
        }
    }

    /**
     * Setup Event Listeners
     *
     * Attaches event listeners to UI elements for user interactions.
     *
     * @function setupEventListeners
     */
    setupEventListeners() {
        console.log('👤 ProfileSettings: Setting up event listeners');

        // Save changes button
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => this.handleSubmit(e));
        }

        // Form submit event
        const settingsForm = document.getElementById('settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Reset form button
        const resetBtn = document.getElementById('reset-profile-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.loadProfileData());
        }
    }

    /**
     * Load Profile Data
     *
     * Loads the current user's profile data and populates the form fields.
     *
     * @async
     * @function loadProfileData
     */
    async loadProfileData() {
        console.log('👤 ProfileSettings: Loading profile data');

        if (!this.currentUser) {
            console.error('👤 ProfileSettings: No current user found');
            return;
        }

        try {
            // Populate form fields with current user data
            this.populateFormFields();

            // Clear any previous messages
            this.clearMessages();

        } catch (error) {
            console.error('👤 ProfileSettings: Error loading profile data:', error);
            this.showMessage('Failed to load profile data', 'error');
        }
    }

    /**
     * Populate Form Fields
     *
     * Populates the profile form with current user data.
     *
     * @function populateFormFields
     */
    populateFormFields() {
        const fields = {
            'username': this.currentUser.username || '',
            'displayName': this.currentUser.displayName || '',
            'email': this.currentUser.email || '',
            'dailyListeningGoal': this.currentUser.dailyListeningGoal || '',
            'timezone': this.currentUser.timezone || ''
        };

        for (const [fieldId, value] of Object.entries(fields)) {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = value;
            }
        }

        // Populate health goals and music preferences if they exist as tags
        this.populateTags('profile-health-goals', this.currentUser.healthGoals || []);
        this.populateTags('profile-music-preferences', this.currentUser.musicPreferences || []);
    }

    /**
     * Populate Tags
     *
     * Populates tag containers with user preferences.
     *
     * @function populateTags
     * @param {string} containerId - ID of the container element
     * @param {Array} tags - Array of tag strings
     */
    populateTags(containerId, tags) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (tags.length === 0) {
            container.innerHTML = '<span class="empty-tag">None set</span>';
            return;
        }

        container.innerHTML = tags.map(tag => 
            `<span class="profile-tag">${this.escapeHtml(tag)}</span>`
        ).join('');
    }

    /**
     * Handle Submit
     *
     * Handles form submission and saves profile changes.
     *
     * @async
     * @function handleSubmit
     * @param {Event} e - Form submit event
     */
    async handleSubmit(e) {
        if (e) e.preventDefault();
        console.log("Submitting");
        if (!this.currentUser?.id) {
            this.showMessage('User not authenticated', 'error');
            return;
        }

        this.setSubmitting(true);
        this.clearMessages();

        try {
            const formData = new FormData(document.getElementById('settings-form'));

            const updateData = {
                id: this.currentUser.id,
                username: formData.get('username') || undefined,
                displayName: formData.get('displayName') || undefined,
                dailyListeningGoal: formData.get('dailyListeningGoal') 
                    ? parseInt(formData.get('dailyListeningGoal')) 
                    : undefined,
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => 
                updateData[key] === undefined && delete updateData[key]
            );

            console.log('👤 ProfileSettings: Sending update data:', updateData);
            /*
            const response = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || responseData.details || 'Failed to update profile');
            }

            // Update local user data
            this.currentUser = responseData.user;
            
            // Show success message
            this.showMessage('Profile updated successfully!', 'success');
            
            // Dispatch event for other parts of the app
            window.dispatchEvent(new CustomEvent('musicare:profile-updated', {
                detail: responseData.user
            }));

            // Update form with new data
            this.populateFormFields();

            // Clear success message after 3 seconds
            setTimeout(() => {
                this.clearMessages();
            }, 3000);
            */

        } catch (error) {
            console.error('👤 ProfileSettings: Error updating profile:', error);
            this.showMessage(error.message || 'Unable to save profile changes', 'error');
        } finally {
            this.setSubmitting(false);
        }
    }

    /**
     * Set Submitting State
     *
     * Updates the form's submitting state and UI.
     *
     * @function setSubmitting
     * @param {boolean} value - Whether form is submitting
     */
    setSubmitting(value) {
        this.formState.isSubmitting = value;
        
        const saveBtn = document.getElementById('save-profile-btn');
        
        if (saveBtn) {
            saveBtn.disabled = value;
            saveBtn.textContent = value ? 'Saving...' : 'Save Changes';
        }

        
        // Disable all form inputs while submitting
        const form = document.getElementById('settings-form');
        if (form) {
            const inputs = form.querySelectorAll('input, select, button');
            inputs.forEach(input => {
                if (input.id !== 'save-profile-btn') {
                    input.disabled = value;
                }
            });
        }
    }

    /**
     * Show Message
     *
     * Displays a message to the user.
     *
     * @function showMessage
     * @param {string} message - Message text
     * @param {string} type - Message type: 'success', 'error'
     */
    showMessage(message, type = 'info') {
        this.clearMessages();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `profile-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            padding: 12px;
            border-radius: 6px;
            margin: 15px 0;
            font-weight: 500;
            animation: fadeIn 0.3s ease;
        `;
        
        if (type === 'success') {
            messageDiv.style.background = 'rgba(34, 197, 94, 0.1)';
            messageDiv.style.color = '#16a34a';
            messageDiv.style.border = '1px solid #86efac';
        } else if (type === 'error') {
            messageDiv.style.background = 'rgba(239, 68, 68, 0.1)';
            messageDiv.style.color = '#dc2626';
            messageDiv.style.border = '1px solid #fca5a5';
        } else {
            messageDiv.style.background = 'rgba(59, 130, 246, 0.1)';
            messageDiv.style.color = '#2563eb';
            messageDiv.style.border = '1px solid #93c5fd';
        }
        
        const form = document.getElementById('settings-form');
        if (form) {
            form.insertBefore(messageDiv, form.querySelector('button[type="submit"]'));
        }
    }

    /**
     * Clear Messages
     *
     * Clears all messages from the form.
     *
     * @function clearMessages
     */
    clearMessages() {
        const messages = document.querySelectorAll('.profile-message');
        messages.forEach(msg => msg.remove());
    }

    /**
     * Cleanup
     *
     * Cleans up resources when user logs out.
     *
     * @function cleanup
     */
    cleanup() {
        console.log('👤 ProfileSettings: Cleaning up');
        this.currentUser = null;
        this.formState = {
            isSubmitting: false,
            error: '',
            success: ''
        };
    }

    /**
     * Escape HTML
     *
     * Escapes HTML characters to prevent XSS attacks.
     *
     * @function escapeHtml
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/**
 * Global ProfileSettings Instance
 *
 * Create a global instance for access from other parts of the app.
 *
 * @global
 * @type {ProfileSettings}
 */
window.profileSettings = new ProfileSettings();

console.log('👤 ProfileSettings: Module loaded');