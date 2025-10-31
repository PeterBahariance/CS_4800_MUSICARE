// src/main.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from './firebase/config';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Export Firebase services
export { auth, firebaseSignOut };

// For debugging
console.log('Firebase initialized:', !!firebaseApp);
console.log('Auth service:', auth);
console.log('Vite present?', typeof import.meta !== 'undefined' && !!import.meta.env?.BASE_URL);

// Make auth available globally if needed
window.auth = auth;

// Form handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const signupContainer = document.getElementById('signup-container');

    // Handle signup link - allow default navigation to signup.html
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            console.log('Navigating to signup page');
            // Let the default link behavior handle the navigation
        });
    }

    // Keep the login form toggle if needed, but remove preventDefault
    if (showLoginLink && loginContainer && signupContainer) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupContainer) signupContainer.style.display = 'none';
            if (loginContainer) loginContainer.style.display = 'block';
        });
    }

    // Login form submission
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
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('User logged in:', userCredential.user);
                // onAuthStateChanged will handle the redirect
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Failed to sign in. Please check your credentials.';

                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = 'Invalid email or password.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many failed attempts. Please try again later.';
                }

                if (errorElement) {
                    errorElement.textContent = errorMessage;
                    errorElement.style.display = 'block';
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

    // Signup form submission
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

            // Reset error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });

            // Validate form
            let hasError = false;

            if (!username) {
                const usernameError = document.getElementById('username-error');
                if (usernameError) {
                    usernameError.textContent = 'Username is required';
                    usernameError.style.display = 'block';
                    hasError = true;
                }
            }

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

            if (password.length < 8) {
                const passwordError = document.getElementById('password-error');
                if (passwordError) {
                    passwordError.textContent = 'Password must be at least 8 characters';
                    passwordError.style.display = 'block';
                    hasError = true;
                }
            }

            if (password !== confirmPassword) {
                const confirmPasswordError = document.getElementById('confirm-password-error');
                if (confirmPasswordError) {
                    confirmPasswordError.textContent = 'Passwords do not match';
                    confirmPasswordError.style.display = 'block';
                    hasError = true;
                }
            }

            if (hasError) return;

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.classList.add('btn-loading');
            if (btnText) btnText.textContent = 'Creating Account...';

            try {
                // Create user in Firebase
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User created:', userCredential.user);

                // Save additional user data to Prisma database
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
                        window.location.href = 'app.html';
                    }, 1500);

                } catch (dbError) {
                    console.error('Database error:', dbError);
                    // Even if database save fails, the user is still created in Firebase
                    // Show a warning but still log them in
                    const warning = document.createElement('div');
                    warning.className = 'warning-message';
                    warning.textContent = 'Account created, but there was an issue saving your profile. You can update it later.';
                    signupForm.insertBefore(warning, signupForm.firstChild);

                    setTimeout(() => {
                        window.location.href = 'app.html';
                    }, 3000);
                }

            } catch (error) {
                console.error('Signup error:', error);

                // Show appropriate error message
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

    // Check if user is already logged in
    let isRedirecting = false;

    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname;
        const isOnAuthPage = currentPath.endsWith('index.html') ||
            currentPath.endsWith('signup.html') ||
            currentPath === '/';

        if (user && !isRedirecting && isOnAuthPage) {
            isRedirecting = true;
            console.log('User is logged in, redirecting to app.html');
            window.location.href = 'app.html';
        } else if (!user && currentPath.endsWith('app.html')) {
            // If user is not logged in and trying to access app.html, redirect to login
            window.location.href = 'index.html';
        }
    });
});
