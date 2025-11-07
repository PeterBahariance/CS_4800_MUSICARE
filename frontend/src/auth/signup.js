// Enhanced signup with health & wellness fields
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { firebaseConfig } from '../config/firebase.js';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Health goals options
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

// Music preferences
const MUSIC_GENRES = [
  'Classical', 'Jazz', 'Ambient', 'Lo-fi', 'Nature Sounds',
  'Binaural Beats', 'Meditation', 'Instrumental', 'Acoustic',
  'Electronic', 'Pop', 'Rock', 'R&B', 'Hip-Hop'
];

// Form handling
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('enhanced-signup-form');
    let currentStep = 1;
    
    // Initialize form steps
    initializeSteps();
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collect all form data
            const formData = {
                email: document.getElementById('email')?.value.trim() || '',
                password: document.getElementById('password')?.value || '',
                confirmPassword: document.getElementById('confirm-password')?.value || '',
                username: document.getElementById('username')?.value.trim() || '',
                dailyListeningGoal: parseInt(document.getElementById('dailyListeningGoal')?.value) || null,
                healthGoals: getSelectedCheckboxes('healthGoals'),
                musicPreferences: getSelectedCheckboxes('musicPreferences')
            };
            
            // Validation
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
                
                // Create user in Firebase
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                console.log('User created in Firebase:', userCredential.user);
                
                // Save to Prisma database
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

