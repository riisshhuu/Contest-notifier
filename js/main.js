import { fetchAllContests, formatDuration } from './api.js';
import { initNotifications, checkForUpcomingContests } from './notifications.js';

// DOM elements
const contestsContainer = document.getElementById('contests-container');
const tabs = document.querySelectorAll('.tab');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const timeFilter = document.getElementById('time-filter');
const sortBy = document.getElementById('sort-by');
const themeToggle = document.getElementById('theme-toggle');

// State
let allContests = [];
let filteredContests = [];

// Initialize app
async function initApp() {
    initNotifications();
    initThemeToggle();
    
    // Load contests
    await loadContests();
    
    // Set up event listeners
    setupEventListeners();
}

// Load contests from all platforms
async function loadContests() {
    showLoading();
    
    try {
        allContests = await fetchAllContests();
        filterAndSortContests();
    } catch (error) {
        console.error('Error loading contests:', error);
        showError('Failed to load contests. Please try again later.');
    }
}

// Filter and sort contests based on current selections
function filterAndSortContests() {
    // Apply platform filter
    const activeTab = document.querySelector('.tab.active');
    const platform = activeTab ? activeTab.dataset.platform : 'all';
    
    filteredContests = platform === 'all' 
        ? [...allContests] 
        : allContests.filter(contest => contest.platform.toLowerCase() === platform);
    
    // Apply search filter
    if (searchInput.value.trim()) {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filteredContests = filteredContests.filter(contest => 
            contest.name.toLowerCase().includes(searchTerm) ||
            contest.platform.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply time filter
    const timeRange = timeFilter.value;
    const now = new Date();
    
    if (timeRange !== 'all') {
        let startDate, endDate;
        
        switch (timeRange) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate = new Date(now);
                endDate = new Date(now);
                endDate.setDate(now.getDate() + 7);
                break;
            case 'month':
                startDate = new Date(now);
                endDate = new Date(now);
                endDate.setMonth(now.getMonth() + 1);
                break;
        }
        
        filteredContests = filteredContests.filter(contest => {
            return contest.startTime >= startDate && contest.startTime <= endDate;
        });
    }
    
    // Apply sorting
    const sortOption = sortBy.value;
    
    filteredContests.sort((a, b) => {
        switch (sortOption) {
            case 'start-asc':
                return a.startTime - b.startTime;
            case 'start-desc':
                return b.startTime - a.startTime;
            case 'duration-asc':
                return a.duration - b.duration;
            case 'duration-desc':
                return b.duration - a.duration;
            default:
                return 0;
        }
    });
    
    displayContests();
    checkForUpcomingContests(filteredContests);
}

// Display contests in the UI
function displayContests() {
    if (filteredContests.length === 0) {
        contestsContainer.innerHTML = `
            <div class="contest-card" style="grid-column: 1 / -1">
                <h2>No contests found</h2>
                <p>Try adjusting your filters or check back later.</p>
            </div>
        `;
        return;
    }
    
    contestsContainer.innerHTML = '';
    
    filteredContests.forEach(contest => {
        const contestCard = document.createElement('div');
        contestCard.className = 'contest-card';
        
        const startTime = contest.startTime;
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        contestCard.innerHTML = `
            <h2>${contest.name}</h2>
            <div class="contest-meta">
                <span><i class="fas fa-laptop-code"></i> ${contest.platform}</span>
                <span><i class="fas fa-calendar-alt"></i> ${startTime.toLocaleDateString('en-US', options)}</span>
                <span><i class="fas fa-clock"></i> ${formatDuration(contest.duration)}</span>
                <span><i class="fas fa-tag"></i> ${contest.type || 'Contest'}</span>
            </div>
            <div class="contest-actions">
                <button class="reminder-btn" data-id="${contest.id}">
                    <i class="far fa-bell"></i> Remind Me
                </button>
                <a href="${contest.link}" class="contest-link" target="_blank">
                    <i class="fas fa-external-link-alt"></i> Go to Contest
                </a>
            </div>
        `;
        
        contestsContainer.appendChild(contestCard);
    });
    
    // Add event listeners to reminder buttons
    document.querySelectorAll('.reminder-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const contestId = btn.dataset.id;
            toggleReminder(contestId, btn);
        });
    });
}

// Toggle reminder for a contest
function toggleReminder(contestId, button) {
    const savedReminders = JSON.parse(localStorage.getItem('contestReminders') || '{}');
    const isSet = !!savedReminders[contestId];
    
    if (isSet) {
        delete savedReminders[contestId];
        button.innerHTML = '<i class="far fa-bell"></i> Remind Me';
        button.classList.remove('active');
    } else {
        savedReminders[contestId] = true;
        button.innerHTML = '<i class="fas fa-bell"></i> Reminder Set';
        button.classList.add('active');
    }
    
    localStorage.setItem('contestReminders', JSON.stringify(savedReminders));
}

// Show loading state
function showLoading() {
    contestsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading contests...</p>
        </div>
    `;
}

// Show error state
function showError(message) {
    contestsContainer.innerHTML = `
        <div class="contest-card" style="grid-column: 1 / -1">
            <h2>Error</h2>
            <p>${message}</p>
            <button id="retry-btn" class="contest-link">Retry</button>
        </div>
    `;
    
    document.getElementById('retry-btn').addEventListener('click', loadContests);
}

// Set up event listeners
function setupEventListeners() {
    // Tab clicks
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterAndSortContests();
        });
    });
    
    // Search
    searchBtn.addEventListener('click', filterAndSortContests);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterAndSortContests();
    });
    
    // Filters
    timeFilter.addEventListener('change', filterAndSortContests);
    sortBy.addEventListener('change', filterAndSortContests);
}

// Theme toggle
function initThemeToggle() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });
    
    // Set initial icon
    const icon = themeToggle.querySelector('i');
    if (currentTheme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Refresh data every 30 minutes
setInterval(loadContests, 30 * 60 * 1000);