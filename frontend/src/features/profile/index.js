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
import userProfileService from './userProfile.js';

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
            
            if (response.status === 404) {
                // User not found in database - this might be normal for new users
                console.log('👤 ProfileSettings: User not found in database (might be new user)');
                return null;
            }
            
            if (!response.ok) {
                // Fallback: search by email
                const currentUser = auth.currentUser;
                if (currentUser && currentUser.email) {
                    console.log('👤 ProfileSettings: Trying fallback search by email');
                    response = await fetch(`/api/users?email=${encodeURIComponent(currentUser.email)}`);
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Handle both response formats: { user: {...} } or direct user object
            if (data.user) {
                console.log('👤 ProfileSettings: User data found (nested format)');
                return data.user;
            } else if (data.id) {
                console.log('👤 ProfileSettings: User data found (direct format)');
                return data;
            } else {
                console.warn('👤 ProfileSettings: Unexpected response format:', data);
                return null;
            }
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
        console.log("👤 ProfileSettings: Submitting form");
        
        if (!this.currentUser?.id) {
            this.showMessage('User not authenticated', 'error');
            return;
        }

        this.setSubmitting(true);
        this.clearMessages();

        try {
            // Get form values directly from input elements
            const form = document.getElementById('settings-form');
            const updateData = {
                id: this.currentUser.id,
                username: document.getElementById('username')?.value || undefined,
                displayName: document.getElementById('displayName')?.value || undefined,
                timezone: document.getElementById('timezone')?.value || undefined,
            };

            // Parse dailyListeningGoal as integer (or undefined if empty)
            const dailyGoalInput = document.getElementById('dailyListeningGoal')?.value;
            if (dailyGoalInput && dailyGoalInput.trim() !== '') {
                const parsed = parseInt(dailyGoalInput, 10);
                if (!isNaN(parsed) && parsed >= 0) {
                    updateData.dailyListeningGoal = parsed;
                } else {
                    this.showMessage('Daily listening goal must be a valid positive number', 'error');
                    this.setSubmitting(false);
                    return;
                }
            }

            // Remove undefined values
            Object.keys(updateData).forEach(key => 
                updateData[key] === undefined && delete updateData[key]
            );
            
            console.log('👤 ProfileSettings: Sending update:', updateData);
            
            // Check if we actually have data to update
            if (Object.keys(updateData).length <= 1) { // Only has id
                this.showMessage('No changes to save', 'info');
                this.setSubmitting(false);
                return;
            }
            
            const response = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const responseData = await response.json();
            console.log('👤 ProfileSettings: API response status:', response.status);
            console.log('👤 ProfileSettings: API response data:', responseData);

            if (!response.ok) {
                // Handle specific error codes
                if (response.status === 409) {
                    throw new Error(responseData.details || 'This username is already taken. Please choose another one.');
                } else if (response.status === 404) {
                    throw new Error('User not found. Please log in again.');
                } else if (response.status === 400) {
                    throw new Error(responseData.details || 'Invalid data provided.');
                } else {
                    throw new Error(responseData.error || responseData.details || `Failed to update profile (${response.status})`);
                }
            }

            // Handle response data - check both possible structures
            let updatedUser;
            if (responseData.user) {
                updatedUser = responseData.user;
            } else if (responseData.id) {
                updatedUser = responseData;
            } else {
                throw new Error('Invalid response format from server');
            }

            // Update local user data
            this.currentUser = updatedUser;
            
            // Show success message
            this.showMessage('Profile updated successfully!', 'success');

            // Update user profile display
            userProfileService.updateProfile(responseData.user);
            
            // Dispatch event for other parts of the app
            window.dispatchEvent(new CustomEvent('musicare:profile-updated', {
                detail: updatedUser
            }));

            // Update form with new data
            this.populateFormFields();

            // Clear success message after 5 seconds
            setTimeout(() => {
                this.clearMessages();
            }, 5000);
            

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
        console.log('👤 ProfileSettings: Showing message:', { message, type });
        
        this.clearMessages();
        const messageDiv = document.createElement('div');
        messageDiv.className = `profile-message ${type}`;
        messageDiv.textContent = message;
        
        // Add inline styles for immediate visibility
        messageDiv.style.cssText = `
            padding: 12px;
            border-radius: 6px;
            margin: 20px 0;
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
        if (!form) {
            console.warn('👤 ProfileSettings: Form not found, showing alert instead');
            alert(`${type.toUpperCase()}: ${message}`);
            return;
        }
        
        // Find the form-actions div (where buttons are)
        const formActions = form.querySelector('.form-actions');
        if (formActions) {
            // Insert before the form-actions div (above the buttons)
            form.insertBefore(messageDiv, formActions);
        } else {
            // Find any button in the form
            const buttons = form.querySelectorAll('button');
            if (buttons.length > 0) {
                // Insert before the first button
                form.insertBefore(messageDiv, buttons[0]);
            } else {
                // Last resort: append to form
                form.appendChild(messageDiv);
            }
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