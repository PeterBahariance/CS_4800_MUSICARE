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
let currentTab = null;

function showTab(tabId) {
  // Hide all content sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });
  
  // Remove active class from all nav items
  navItems.forEach(item => {
    item.classList.remove('active');
  });
  
  // Show the selected tab content
  const contentSection = document.getElementById(`${tabId}-content`);
  if (contentSection) {
    contentSection.style.display = 'block';
  } else {
    // If content section doesn't exist, try to get it from the templates
    const template = document.querySelector(`.content-templates #${tabId}-content`);
    if (template) {
      const content = template.cloneNode(true);
      content.id = `${tabId}-content`;
      content.className = 'content-section';
      document.querySelector('.main-content').appendChild(content);
      content.style.display = 'block';
    }
  }
  
  // Add active class to clicked nav item
  const activeNavItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }
  
  currentTab = tabId;
}

// Initialize tab navigation
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const tabId = item.getAttribute('data-tab');
    showTab(tabId);
    
    // Update URL without reloading the page
    window.history.pushState({ tab: tabId }, '', `?tab=${tabId}`);
  });
});

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
  const tabId = e.state?.tab || 'about';
  showTab(tabId);
});

// Show initial tab from URL or default to 'about'
const urlParams = new URLSearchParams(window.location.search);
const initialTab = urlParams.get('tab') || 'about';
showTab(initialTab);

// Initialize any other app-specific functionality here
console.log('App initialized');
