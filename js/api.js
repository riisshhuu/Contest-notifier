// API endpoints and status tracking
const API_STATUS = {
    codeforces: { online: false, lastChecked: null },
    leetcode: { online: false, lastChecked: null },
    codechef: { online: false, lastChecked: null },
    gfg: { online: false, lastChecked: null }
};

// Update API status display
function updateApiStatusDisplay() {
    for (const platform in API_STATUS) {
        const element = document.getElementById(`${platform}-status`);
        if (element) {
            const icon = element.querySelector('i');
            if (API_STATUS[platform].online) {
                element.classList.add('online');
                element.classList.remove('offline');
                icon.classList.add('fa-check-circle');
                icon.classList.remove('fa-circle', 'fa-times-circle');
            } else {
                element.classList.add('offline');
                element.classList.remove('online');
                icon.classList.add('fa-times-circle');
                icon.classList.remove('fa-circle', 'fa-check-circle');
            }
        }
    }
}

// Fetch Codeforces contests
async function fetchCodeforcesContests() {
    try {
        const response = await fetch('https://codeforces.com/api/contest.list');
        const data = await response.json();
        API_STATUS.codeforces = { online: true, lastChecked: new Date() };
        
        if (data.status === 'OK') {
            return data.result
                .filter(contest => contest.phase === 'BEFORE')
                .map(contest => ({
                    id: `cf-${contest.id}`,
                    name: contest.name,
                    platform: 'codeforces',
                    startTime: new Date(contest.startTimeSeconds * 1000),
                    duration: contest.durationSeconds,
                    link: `https://codeforces.com/contest/${contest.id}`,
                    type: contest.type.includes('Div.') ? 'Rated' : 'Contest'
                }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching Codeforces contests:', error);
        API_STATUS.codeforces = { online: false, lastChecked: new Date() };
        return [];
    }
}

// Fetch LeetCode contests (using mock data as LeetCode doesn't have a public API)
async function fetchLeetCodeContests() {
    try {
        // In a real app, you would use a proxy server to scrape LeetCode
        API_STATUS.leetcode = { online: true, lastChecked: new Date() };
        
        // Mock data - replace with actual implementation
        const mockData = [
            {
                id: 'lc-001',
                name: 'Weekly Contest 345',
                platform: 'leetcode',
                startTime: new Date(Date.now() + 86400000), // Tomorrow
                duration: 5400, // 1.5 hours in seconds
                link: 'https://leetcode.com/contest/weekly-contest-345',
                type: 'Weekly'
            },
            {
                id: 'lc-002',
                name: 'Biweekly Contest 105',
                platform: 'leetcode',
                startTime: new Date(Date.now() + 3 * 86400000), // 3 days from now
                duration: 7200, // 2 hours in seconds
                link: 'https://leetcode.com/contest/biweekly-contest-105',
                type: 'Biweekly'
            }
        ];
        
        return mockData;
    } catch (error) {
        console.error('Error fetching LeetCode contests:', error);
        API_STATUS.leetcode = { online: false, lastChecked: new Date() };
        return [];
    }
}

// Fetch CodeChef contests (using their API)
async function fetchCodeChefContests() {
    try {
        const response = await fetch('https://www.codechef.com/api/list/contests');
        const data = await response.json();
        API_STATUS.codechef = { online: true, lastChecked: new Date() };
        
        const futureContests = [...data.future_contests, ...data.present_contests];
        
        return futureContests.map(contest => ({
            id: `cc-${contest.contest_code}`,
            name: contest.contest_name,
            platform: 'codechef',
            startTime: new Date(contest.contest_start_date),
            duration: contest.contest_duration * 60, // Convert to seconds
            link: `https://www.codechef.com/${contest.contest_code}`,
            type: contest.contest_code.includes('START') ? 'Starters' : 'Cook-Off'
        }));
    } catch (error) {
        console.error('Error fetching CodeChef contests:', error);
        API_STATUS.codechef = { online: false, lastChecked: new Date() };
        return [];
    }
}

// Fetch GeeksforGeeks contests (mock data as scraping required)
async function fetchGFGContests() {
    try {
        API_STATUS.gfg = { online: true, lastChecked: new Date() };
        
        // Mock data - replace with actual implementation
        const mockData = [
            {
                id: 'gfg-001',
                name: 'Problem Of The Day',
                platform: 'gfg',
                startTime: new Date(new Date().setHours(0, 0, 0, 0)),
                duration: 86400, // 1 day in seconds
                link: 'https://practice.geeksforgeeks.org/problem-of-the-day',
                type: 'Daily'
            },
            {
                id: 'gfg-002',
                name: 'Monthly Coding Contest',
                platform: 'gfg',
                startTime: new Date(new Date().setDate(new Date().getDate() + 7)),
                duration: 18000, // 5 hours in seconds
                link: 'https://practice.geeksforgeeks.org/contest/monthly-coding-contest',
                type: 'Monthly'
            }
        ];
        
        return mockData;
    } catch (error) {
        console.error('Error fetching GFG contests:', error);
        API_STATUS.gfg = { online: false, lastChecked: new Date() };
        return [];
    }
}

// Fetch all contests
async function fetchAllContests() {
    const [codeforces, leetcode, codechef, gfg] = await Promise.all([
        fetchCodeforcesContests(),
        fetchLeetCodeContests(),
        fetchCodeChefContests(),
        fetchGFGContests()
    ]);
    
    updateApiStatusDisplay();
    return [...codeforces, ...leetcode, ...codechef, ...gfg];
}

// Format duration from seconds to human readable
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${minutes}m`;
    }
}

export { fetchAllContests, formatDuration, updateApiStatusDisplay };