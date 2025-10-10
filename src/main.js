// src/main.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
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
    
    // Toggle between login and signup forms
    if (showSignupLink && loginContainer && signupContainer) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.style.display = 'none';
            signupContainer.style.display = 'block';
        });
    }

    if (showLoginLink && loginContainer && signupContainer) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            signupContainer.style.display = 'none';
            loginContainer.style.display = 'block';
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
            
            const email = document.getElementById('signup-email')?.value || '';
            const password = document.getElementById('signup-password')?.value || '';
            const confirmPassword = document.getElementById('signup-confirm-password')?.value || '';
            const errorElement = document.getElementById('signup-error');
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            
            // Reset error messages
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
            
            // Validate form
            if (password !== confirmPassword) {
                if (errorElement) {
                    errorElement.textContent = 'Passwords do not match';
                    errorElement.style.display = 'block';
                }
                return;
            }
            
            if (password.length < 6) {
                if (errorElement) {
                    errorElement.textContent = 'Password must be at least 6 characters';
                    errorElement.style.display = 'block';
                }
                return;
            }
            
            // Show loading state
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Creating Account...';
            
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User created:', userCredential.user);
                
                // Show success message and switch to login
                if (signupContainer) signupContainer.style.display = 'none';
                if (loginContainer) loginContainer.style.display = 'block';
                const successElement = document.getElementById('signup-success');
                if (successElement) successElement.style.display = 'block';
                
                // Reset form
                signupForm.reset();
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
    
    // Check if user is already logged in
    let isRedirecting = false;
    
    onAuthStateChanged(auth, (user) => {
        if (user && !isRedirecting && !window.location.pathname.endsWith('app.html')) {
            isRedirecting = true;
            console.log('User is logged in, redirecting to app.html');
            window.location.href = 'app.html';
        }
    });
});
