// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { firebaseConfig } from './firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');
const signOutBtn = document.getElementById('sign-out-btn');

// Check auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    userInfo.style.display = 'block';
    userEmail.textContent = user.email;
    
    // Set up sign out button
    signOutBtn.addEventListener('click', handleSignOut);
  } else {
    // User is signed out, redirect to login
    window.location.href = 'index.html';
  }
});

// Handle sign out
async function handleSignOut() {
  try {
    await firebaseSignOut(auth);
    // Redirect happens automatically due to onAuthStateChanged
  } catch (error) {
    console.error('Error signing out:', error);
    alert('Error signing out. Please try again.');
  }
}

// Tab navigation
const navItems = document.querySelectorAll('.nav-item[data-tab]');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabId = item.getAttribute('data-tab');
    // Handle tab switching logic here
    console.log(`Switching to tab: ${tabId}`);
  });
});

// Initialize any other app-specific functionality here
console.log('App initialized');
