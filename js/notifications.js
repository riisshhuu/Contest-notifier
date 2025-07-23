// Notification preferences
let notificationPreferences = {
    enabled: true,
    times: [15, 60], // minutes before contest
    platforms: ['leetcode', 'codeforces', 'codechef']
};

// Load preferences from localStorage
function loadPreferences() {
    const savedPrefs = localStorage.getItem('contestNotifierPrefs');
    if (savedPrefs) {
        notificationPreferences = JSON.parse(savedPrefs);
    }
    updatePreferencesUI();
}

// Save preferences to localStorage
function savePreferences() {
    localStorage.setItem('contestNotifierPrefs', JSON.stringify(notificationPreferences));
}

// Update UI based on preferences
function updatePreferencesUI() {
    const form = document.getElementById('notif-form');
    if (!form) return;
    
    form.elements['enable-notif'].checked = notificationPreferences.enabled;
    
    // Clear all time checkboxes
    document.querySelectorAll('input[name="notif-time"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Set checked based on preferences
    notificationPreferences.times.forEach(time => {
        const checkbox = document.querySelector(`input[name="notif-time"][value="${time}"]`);
        if (checkbox) checkbox.checked = true;
    });
    
    // Clear all platform checkboxes
    document.querySelectorAll('input[name="platform"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Set checked based on preferences
    notificationPreferences.platforms.forEach(platform => {
        const checkbox = document.querySelector(`input[name="platform"][value="${platform}"]`);
        if (checkbox) checkbox.checked = true;
    });
}

// Handle form submission
function setupPreferencesForm() {
    const form = document.getElementById('notif-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        notificationPreferences.enabled = form.elements['enable-notif'].checked;
        
        // Get selected times
        notificationPreferences.times = [];
        document.querySelectorAll('input[name="notif-time"]:checked').forEach(checkbox => {
            notificationPreferences.times.push(parseInt(checkbox.value));
        });
        
        // Get selected platforms
        notificationPreferences.platforms = [];
        document.querySelectorAll('input[name="platform"]:checked').forEach(checkbox => {
            notificationPreferences.platforms.push(checkbox.value);
        });
        
        savePreferences();
        alert('Preferences saved successfully!');
        document.getElementById('notification-prefs').classList.add('hidden');
    });
}

// Check for upcoming contests and show notifications
function checkForUpcomingContests(contests) {
    if (!notificationPreferences.enabled) return;
    
    const now = new Date();
    
    contests.forEach(contest => {
        // Skip if platform not in preferences
        if (!notificationPreferences.platforms.includes(contest.platform.toLowerCase())) {
            return;
        }
        
        notificationPreferences.times.forEach(minutes => {
            const notifyTime = new Date(contest.startTime.getTime() - minutes * 60000);
            
            // If current time is close to notification time (±5 minutes)
            if (Math.abs(now - notifyTime) < 300000) {
                showNotification(contest, minutes);
            }
        });
    });
}

// Show browser notification
function showNotification(contest, minutesBefore) {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notifications');
        return;
    }
    
    if (Notification.permission === 'granted') {
        createNotification(contest, minutesBefore);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                createNotification(contest, minutesBefore);
            }
        });
    }
}

function createNotification(contest, minutesBefore) {
    const notification = new Notification(`Contest Starting Soon! (${minutesBefore} min)`, {
        body: `${contest.name} on ${contest.platform} starts at ${contest.startTime.toLocaleTimeString()}`,
        icon: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png'
    });
    
    notification.onclick = () => {
        window.open(contest.link, '_blank');
    };
}

// Initialize notification system
function initNotifications() {
    loadPreferences();
    setupPreferencesForm();
    
    // Setup modal toggle
    const notifToggle = document.getElementById('notif-toggle');
    const modal = document.getElementById('notification-prefs');
    const closeModal = document.querySelector('.close-modal');
    
    if (notifToggle && modal) {
        notifToggle.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

export { initNotifications, checkForUpcomingContests };