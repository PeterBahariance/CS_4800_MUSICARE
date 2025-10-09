// Import the Firebase configuration
import { firebaseConfig } from './firebase/firebase-config';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged
} from 'firebase/auth';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Make auth available globally for debugging
window.auth = auth;

// Form handling
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    
    // Check if user is already logged in
    let isRedirecting = false;
    
    onAuthStateChanged(auth, (user) => {
        // Only redirect if user is logged in, not already redirecting, and not on the dashboard page
        if (user && !isRedirecting && !window.location.pathname.endsWith('dashboard.html')) {
            isRedirecting = true;
            console.log('Redirecting to dashboard...');
            window.location.href = '/dashboard.html';
        }
    });

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const email = signupForm.querySelector('#email').value;
            const password = signupForm.querySelector('#password').value;
            const confirmPassword = signupForm.querySelector('#confirm-password').value;
            
            // Reset error messages
            document.querySelectorAll('.error-message').forEach(el => {
                el.textContent = '';
                el.style.display = 'none';
            });
            
            // Validate form
            let hasError = false;
            
            if (password !== confirmPassword) {
                const errorElement = document.getElementById('confirm-password-error');
                if (errorElement) {
                    errorElement.textContent = 'Passwords do not match';
                    errorElement.style.display = 'block';
                    hasError = true;
                }
            }
            
            if (password.length < 8) {
                const errorElement = document.getElementById('password-error');
                if (errorElement) {
                    errorElement.textContent = 'Password must be at least 8 characters';
                    errorElement.style.display = 'block';
                    hasError = true;
                }
            }
            
            if (hasError) return;
            
            // Disable submit button and show loading state
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Creating Account...';
            
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User created:', userCredential.user);
                // Don't redirect here - the onAuthStateChanged will handle it
                // This prevents multiple redirects
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
                
                const errorElement = document.getElementById('signup-error');
                if (errorElement) {
                    errorElement.textContent = errorMessage;
                    errorElement.style.display = 'block';
                }
                
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
