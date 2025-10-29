// Import Firebase modules
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { firebaseConfig } from './firebase/config';
import './friends.js'; // Import friend system

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
  // Get the main content area
  const mainContent = document.querySelector('.main-content');

  // Hide all content sections and remove them from the DOM
  const existingSections = document.querySelectorAll('.content-section');
  existingSections.forEach(section => {
    if (section.id !== `${tabId}-content`) {
      section.remove();
    }
  });

  // Remove active class from all nav items
  navItems.forEach(item => {
    item.classList.remove('active');
  });

  // Show the selected tab content
  let contentSection = document.getElementById(`${tabId}-content`);

  if (!contentSection) {
    // If content section doesn't exist, try to get it from the templates
    const template = document.querySelector(`.content-templates #${tabId}-content`);
    if (template) {
      contentSection = template.cloneNode(true);
      contentSection.id = `${tabId}-content`;
      contentSection.className = 'content-section';

      // Insert the content section after the welcome message or at the beginning of main content
      const welcomeMessage = document.querySelector('.welcome-message');
      if (welcomeMessage && welcomeMessage.nextSibling) {
        welcomeMessage.parentNode.insertBefore(contentSection, welcomeMessage.nextSibling);
      } else {
        mainContent.insertBefore(contentSection, mainContent.firstChild);
      }
    }
  }

  // Show the content section with a nice animation
  if (contentSection) {
    contentSection.style.display = 'block';
    contentSection.style.opacity = '0';
    contentSection.style.transform = 'translateY(20px)';
    contentSection.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    // Trigger reflow
    void contentSection.offsetWidth;

    // Animate in
    contentSection.style.opacity = '1';
    contentSection.style.transform = 'translateY(0)';
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
