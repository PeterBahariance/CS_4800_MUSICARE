// src/pages/signup.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { firebaseConfig } from '../firebase/config';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Form handling
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value.trim() || '';
            const password = document.getElementById('password')?.value || '';
            const confirmPassword = document.getElementById('confirm-password')?.value || '';
            
            // Basic validation
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            try {
                // Create user in Firebase
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User created:', userCredential.user);
                
                // Redirect to app after successful signup
                window.location.href = '/app.html';
            } catch (error) {
                console.error('Signup error:', error);
                showError(error.message);
            }
        });
    }
});

function showError(message) {
    const errorElement = document.getElementById('signup-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}
