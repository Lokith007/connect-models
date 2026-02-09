const fetchBtn = document.getElementById('fetchBtn');
const usernameInput = document.getElementById('usernameInput');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');
const rawDataContainer = document.getElementById('raw-data-container');

fetchBtn.addEventListener('click', getStats);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') getStats();
});

async function getStats() {
    const rawInput = usernameInput.value.trim();
    if (!rawInput) return;

    // Clean input (remove @ or full URL if pasted)
    let username = rawInput;
    if (username.includes('instagram.com/')) {
        const match = username.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        if (match) username = match[1];
    }
    username = username.replace('@', '');

    // Reset UI
    resultsDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');
    rawDataContainer.classList.add('hidden');

    try {
        const response = await fetch(`http://localhost:5001/instagram?username=${username}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || data.error || 'Failed to fetch stats');

        if (data.warning) {
            // Partial success / Raw data fallback
            showRawData(data.raw);
            throw new Error(data.warning);
        }

        renderStats(data);
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
    }
}

function renderStats(data) {
    document.getElementById('profilePic').src = data.profile_pic_url;
    document.getElementById('fullName').textContent = data.full_name || data.username;
    document.getElementById('usernameDisplay').textContent = `@${data.username}`;
    document.getElementById('biography').textContent = data.biography || '';

    document.getElementById('followers').textContent = formatNumber(data.followers);
    document.getElementById('following').textContent = formatNumber(data.following);
    document.getElementById('posts').textContent = formatNumber(data.posts);

    const privateBadge = document.getElementById('privateBadge');
    if (data.is_private) {
        privateBadge.classList.remove('hidden');
    } else {
        privateBadge.classList.add('hidden');
    }

    resultsDiv.classList.remove('hidden');
}

function showRawData(data) {
    const rawPre = document.getElementById('rawData');
    rawPre.textContent = JSON.stringify(data, null, 2);
    rawDataContainer.classList.remove('hidden');
}

function formatNumber(num) {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
}
