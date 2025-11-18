/**
 * @fileoverview Enhanced Signup Authentication Module
 *
 * Comprehensive user registration system for the Musicare application with
 * multi-step form, health & wellness goal collection, and music preference selection.
 * Integrates Firebase Authentication with Prisma database for complete user profiles.
 *
 * Features:
 * - Multi-step signup form with validation
 * - Health & wellness goal selection
 * - Music genre preference collection
 * - Daily listening goal setting
 * - Firebase Auth + Prisma database integration
 * - Automatic timezone detection
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js - Firebase core
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js - Firebase authentication
 * @requires ../config/firebase.js - Firebase configuration
 *
 * @example
 * // This module is loaded via script tag in signup.html:
 * // <script type="module" src="../src/auth/signup.js"></script>
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from '../config/firebase.js';

/**
 * Firebase Application Instance
 *
 * @constant {FirebaseApp} firebaseApp
 */
const firebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase Authentication Service
 *
 * @constant {Auth} auth
 */
const auth = getAuth(firebaseApp);

/**
 * Health & Wellness Goals Configuration
 *
 * Predefined list of therapeutic health goals that users can select during signup.
 * These goals are used to personalize music recommendations and track wellness progress.
 *
 * @constant {Array<{value: string, label: string}>} HEALTH_GOALS
 *
 * @example
 * // User selects goals during signup:
 * // - Mental Wellness
 * // - Stress Relief
 * // - Better Sleep
 */
const HEALTH_GOALS = [
  { value: 'mental_wellness', label: 'Mental Wellness' },
  { value: 'stress_relief', label: 'Stress Relief' },
  { value: 'sleep_improvement', label: 'Better Sleep' },
  { value: 'focus', label: 'Focus & Concentration' },
  { value: 'exercise', label: 'Exercise Motivation' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'anxiety_relief', label: 'Anxiety Relief' },
  { value: 'mood_boost', label: 'Mood Boost' }
];

/**
 * Music Genre Preferences
 *
 * Available music genres for user preference selection.
 * Used to personalize playlist recommendations and music discovery.
 *
 * @constant {Array<string>} MUSIC_GENRES
 */
const MUSIC_GENRES = [
  'Classical', 'Jazz', 'Ambient', 'Lo-fi', 'Nature Sounds',
  'Binaural Beats', 'Meditation', 'Instrumental', 'Acoustic',
  'Electronic', 'Pop', 'Rock', 'R&B', 'Hip-Hop'
];

/**
 * Main Form Initialization and Event Handling
 *
 * Sets up the multi-step signup form with validation, Firebase authentication,
 * and database integration. Handles form submission, step navigation, and
 * user profile creation.
 */
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('enhanced-signup-form');
    let currentStep = 1;

    // Initialize form steps (render checkboxes, set up UI)
    initializeSteps();

    /**
     * Enhanced Signup Form Submission Handler
     *
     * Handles the complete signup flow:
     * 1. Collects and validates all form data
     * 2. Creates user in Firebase Authentication
     * 3. Saves extended profile to Prisma database
     * 4. Redirects to app on success
     *
     * @async
     * @function handleSignupSubmit
     * @param {Event} e - Form submission event
     * @throws {Error} Firebase authentication or database errors
     */
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collect all form data from multi-step form
            const formData = {
                email: document.getElementById('email')?.value.trim() || '',
                password: document.getElementById('password')?.value || '',
                confirmPassword: document.getElementById('confirm-password')?.value || '',
                username: document.getElementById('username')?.value.trim() || '',
                dailyListeningGoal: parseInt(document.getElementById('dailyListeningGoal')?.value) || null,
                healthGoals: getSelectedCheckboxes('healthGoals'),
                musicPreferences: getSelectedCheckboxes('musicPreferences')
            };

            // Client-side validation
            if (!formData.email || !formData.password) {
                showError('Email and password are required');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            if (formData.password.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }
            
            try {
                showLoading(true);

                /**
                 * Step 1: Create user in Firebase Authentication
                 *
                 * Creates the authentication account with email and password.
                 */
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                console.log('User created in Firebase:', userCredential.user);

                /**
                 * Step 2: Save extended user profile to Prisma database
                 *
                 * Saves health goals, music preferences, listening goals, and other
                 * profile data to PostgreSQL via the /api/users endpoint.
                 *
                 * Profile includes:
                 * - Basic info (email, username, displayName)
                 * - Health & wellness goals
                 * - Music genre preferences
                 * - Daily listening goal (minutes)
                 * - Timezone (auto-detected)
                 */
                try {
                    console.log('Saving user to database...');
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: formData.email,
                            username: formData.username || null,
                            displayName: formData.username || formData.email.split('@')[0],
                            dailyListeningGoal: formData.dailyListeningGoal,
                            healthGoals: formData.healthGoals,
                            musicPreferences: formData.musicPreferences,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        })
                    });

                    console.log('API Response status:', response.status);
                    const responseData = await response.json();
                    console.log('API Response data:', responseData);

                    if (!response.ok) {
                        throw new Error(responseData.error || 'Failed to save user data');
                    }

                    console.log('User successfully saved to database');
                    showSuccess('Account created successfully! Redirecting...');

                    // Redirect to app after brief delay
                    setTimeout(() => {
                        window.location.href = '/pages/app.html';
                    }, 1500);

                } catch (dbError) {
                    console.error('Database error:', dbError);
                    showError('Account created but profile setup failed: ' + dbError.message);
                }

            } catch (error) {
                console.error('Signup error:', error);
                showError(getFirebaseErrorMessage(error));
                showLoading(false);
            }
        });
    }
    
    // Multi-step navigation
    const nextBtns = document.querySelectorAll('.next-step');
    const prevBtns = document.querySelectorAll('.prev-step');
    
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });
    
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
    });
});

function initializeSteps() {
    // Render health goals checkboxes
    const healthGoalsContainer = document.getElementById('healthGoalsContainer');
    if (healthGoalsContainer) {
        healthGoalsContainer.innerHTML = HEALTH_GOALS.map(goal => `
            <label class="checkbox-label">
                <input type="checkbox" name="healthGoals" value="${goal.value}">
                <span>${goal.label}</span>
            </label>
        `).join('');
    }
    
    // Render music preferences checkboxes
    const musicPrefsContainer = document.getElementById('musicPreferencesContainer');
    if (musicPrefsContainer) {
        musicPrefsContainer.innerHTML = MUSIC_GENRES.map(genre => `
            <label class="checkbox-label">
                <input type="checkbox" name="musicPreferences" value="${genre}">
                <span>${genre}</span>
            </label>
        `).join('');
    }
}

function showStep(step) {
    document.querySelectorAll('.form-step').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === step);
    });
    
    // Update progress indicator (2 steps total)
    const progress = (step / 2) * 100;
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    // Update step indicators
    document.querySelectorAll('.step-indicator .step').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === step);
    });
}

function validateStep(step) {
    if (step === 1) {
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        
        if (!email || !password || !confirmPassword) {
            showError('Please fill in all required fields');
            return false;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return false;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return false;
        }
    }
    return true;
}

function getSelectedCheckboxes(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function showError(message) {
    const errorElement = document.getElementById('signup-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const successElement = document.getElementById('signup-success');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
}

function showLoading(show) {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = show;
        submitBtn.textContent = show ? 'Creating Account...' : 'Create Account';
    }
}

function getFirebaseErrorMessage(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    };
    return errorMessages[error.code] || error.message;
}

