/**
 * @fileoverview Login Authentication Module
 *
 * Handles user authentication for the Musicare application login page.
 * Manages Firebase authentication initialization, login form submission,
 * and automatic redirection based on authentication state.
 *
 * This module is loaded on the main login page (index.html) and handles:
 * - Firebase app initialization
 * - Email/password login
 * - Form validation and error handling
 * - Automatic redirect to app when authenticated
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-14
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js - Firebase core
 * @requires https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js - Firebase authentication
 * @requires ../config/firebase.js - Firebase configuration
 *
 * @example
 * // This module is loaded via script tag in index.html:
 * // <script type="module" src="./src/auth/index.js"></script>
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from '../config/firebase.js';

/**
 * Firebase Application Instance
 *
 * Initialized Firebase app instance used throughout the authentication flow.
 *
 * @constant {FirebaseApp} firebaseApp
 */
const firebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase Authentication Service
 *
 * Main authentication service instance for handling user login, logout,
 * and authentication state changes.
 *
 * @constant {Auth} auth
 */
const auth = getAuth(firebaseApp);

// Export Firebase services for use in other modules
export { auth, firebaseSignOut };

/**
 * Debug Logging
 *
 * Logs Firebase initialization status for debugging purposes.
 *
 * @private
 */
console.log('Firebase initialized:', !!firebaseApp);
console.log('Auth service:', auth);
console.log('Vite present?', typeof import.meta !== 'undefined' && !!import.meta.env?.BASE_URL);

/**
 * Global Auth Access
 *
 * Makes auth service available globally on window object for debugging
 * and potential use in inline scripts.
 *
 * @global
 */
window.auth = auth;

/**
 * DOM Content Loaded Event Handler
 *
 * Initializes all authentication form handlers and navigation once the DOM is ready.
 * Sets up event listeners for login form submission, signup navigation, and
 * authentication state monitoring.
 *
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const signupContainer = document.getElementById('signup-container');

    /**
     * Signup Link Navigation Handler
     *
     * Allows default navigation to signup.html page.
     * Logs navigation for debugging purposes.
     */
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            console.log('Navigating to signup page');
            // Let the default link behavior handle the navigation
        });
    }

    /**
     * Login Form Toggle Handler
     *
     * Handles toggling between login and signup forms if both are present
     * on the same page (legacy behavior, may not be used in current implementation).
     */
    if (showLoginLink && loginContainer && signupContainer) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupContainer) signupContainer.style.display = 'none';
            if (loginContainer) loginContainer.style.display = 'block';
        });
    }

    /**
     * Login Form Submission Handler
     *
     * Handles user login via email and password authentication.
     * Provides loading states, error handling, and automatic redirect on success.
     *
     * @async
     * @function handleLoginSubmit
     * @param {Event} e - Form submission event
     * @throws {Error} Firebase authentication errors
     *
     * @example
     * // User enters credentials and submits form
     * // On success: Redirects to app.html via onAuthStateChanged
     * // On error: Displays user-friendly error message
     */
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email')?.value || '';
            const password = document.getElementById('login-password')?.value || '';
            const errorElement = document.getElementById('login-error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Show loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Signing in...';

            try {
                // Authenticate user with Firebase
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('User logged in:', userCredential.user);
                // onAuthStateChanged will handle the redirect to app.html
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Failed to sign in. Please check your credentials.';

                // Provide user-friendly error messages based on error code
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = 'Invalid email or password.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many failed attempts. Please try again later.';
                }

                // Display error message to user
                if (errorElement) {
                    errorElement.textContent = errorMessage;
                    errorElement.style.display = 'block';
                    // Auto-hide error after 5 seconds
                    setTimeout(() => {
                        errorElement.style.display = 'none';
                    }, 5000);
                }

                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    /**
     * Signup Form Submission Handler
     *
     * Handles new user registration with comprehensive validation.
     * Creates user in Firebase Auth and saves profile to Prisma database.
     *
     * Note: This handler is present for backward compatibility but signup
     * is now primarily handled in signup.js on the dedicated signup page.
     *
     * @async
     * @function handleSignupSubmit
     * @param {Event} e - Form submission event
     * @throws {Error} Firebase authentication or database errors
     *
     * Validation Rules:
     * - Username: Required
     * - Email: Required, valid format
     * - Password: Minimum 8 characters
     * - Confirm Password: Must match password
     */
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email')?.value.trim() || '';
            const password = document.getElementById('password')?.value || '';
            const confirmPassword = document.getElementById('confirm-password')?.value || '';
            const username = document.getElementById('username')?.value.trim() || '';

            const errorElement = document.getElementById('signup-error');
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.btn-text');

            // Reset all error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });

            // Client-side validation
            let hasError = false;

            // Validate username
            if (!username) {
                const usernameError = document.getElementById('username-error');
                if (usernameError) {
                    usernameError.textContent = 'Username is required';
                    usernameError.style.display = 'block';
                    hasError = true;
                }
            }

            // Validate email
            if (!email) {
                const emailError = document.getElementById('email-error');
                if (emailError) {
                    emailError.textContent = 'Email is required';
                    emailError.style.display = 'block';
                    hasError = true;
                }
            } else if (!/\S+@\S+\.\S+/.test(email)) {
                const emailError = document.getElementById('email-error');
                if (emailError) {
                    emailError.textContent = 'Please enter a valid email address';
                    emailError.style.display = 'block';
                    hasError = true;
                }
            }

            // Validate password length
            if (password.length < 8) {
                const passwordError = document.getElementById('password-error');
                if (passwordError) {
                    passwordError.textContent = 'Password must be at least 8 characters';
                    passwordError.style.display = 'block';
                    hasError = true;
                }
            }

            // Validate password confirmation
            if (password !== confirmPassword) {
                const confirmPasswordError = document.getElementById('confirm-password-error');
                if (confirmPasswordError) {
                    confirmPasswordError.textContent = 'Passwords do not match';
                    confirmPasswordError.style.display = 'block';
                    hasError = true;
                }
            }

            // Stop if validation failed
            if (hasError) return;

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-loading');
            if (btnText) btnText.textContent = 'Creating Account...';

            try {
                /**
                 * Step 1: Create user in Firebase Authentication
                 *
                 * Creates the user account in Firebase Auth system.
                 * This provides authentication capabilities.
                 */
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User created:', userCredential.user);

                /**
                 * Step 2: Save user profile to Prisma database
                 *
                 * Saves additional user data (email, displayName) to the PostgreSQL
                 * database via the /api/users endpoint. This allows for extended
                 * user profiles beyond what Firebase Auth provides.
                 */
                try {
                    console.log('Attempting to save user to database:', email);
                    const response = await fetch('/api/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email,
                            displayName: username
                        })
                    });

                    console.log('API Response status:', response.status);
                    const responseData = await response.json();
                    console.log('API Response data:', responseData);

                    if (!response.ok) {
                        throw new Error('Failed to save user data: ' + (responseData.error || 'Unknown error'));
                    }

                    console.log('User successfully saved to database');

                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'success-message';
                    successMessage.textContent = 'Account created successfully! Redirecting...';
                    signupForm.appendChild(successMessage);

                    // Redirect to app after a short delay
                    setTimeout(() => {
                        window.location.href = 'pages/app.html';
                    }, 1500);

                } catch (dbError) {
                    console.error('Database error:', dbError);
                    /**
                     * Graceful degradation: Even if database save fails,
                     * the user is still created in Firebase Auth.
                     * Show a warning but still allow them to proceed.
                     */
                    const warning = document.createElement('div');
                    warning.className = 'warning-message';
                    warning.textContent = 'Account created, but there was an issue saving your profile. You can update it later.';
                    signupForm.insertBefore(warning, signupForm.firstChild);

                    setTimeout(() => {
                        window.location.href = 'pages/app.html';
                    }, 3000);
                }

            } catch (error) {
                console.error('Signup error:', error);

                // Provide user-friendly error messages based on Firebase error codes
                let errorMessage = 'An error occurred during signup. Please try again.';

                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'An account with this email already exists.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Please enter a valid email address.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password should be at least 6 characters.';
                }

                if (errorElement) {
                    errorElement.textContent = errorMessage;
                    errorElement.style.display = 'block';
                }

                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.classList.remove('btn-loading');
                if (btnText) btnText.textContent = 'Create Account';
            }
        });
    }

    /**
     * Authentication State Monitor
     *
     * Monitors Firebase authentication state and handles automatic redirects:
     * - If user is logged in and on auth page → redirect to app
     * - If user is not logged in and on app page → redirect to login
     *
     * This ensures users can't access the app without authentication and
     * prevents authenticated users from seeing the login page unnecessarily.
     *
     * @listens onAuthStateChanged
     * @param {User|null} user - Firebase user object or null if not authenticated
     */
    let isRedirecting = false;

    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname;
        const isOnAuthPage = currentPath.endsWith('index.html') ||
            currentPath.endsWith('signup.html') ||
            currentPath === '/';

        if (user && !isRedirecting && isOnAuthPage) {
            // User is authenticated and on login/signup page → redirect to app
            isRedirecting = true;
            console.log('User is logged in, redirecting to app.html');
            window.location.href = 'pages/app.html';
        } else if (!user && currentPath.endsWith('app.html')) {
            // User is not authenticated and trying to access app → redirect to login
            window.location.href = '../index.html';
        }
    });
});

