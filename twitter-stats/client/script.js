const fetchBtn = document.getElementById('fetchBtn');
const urlInput = document.getElementById('urlInput');
const resultsDiv = document.getElementById('results');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');

fetchBtn.addEventListener('click', getStats);

async function getStats() {
    const url = urlInput.value.trim();
    if (!url) return;

    // Reset UI
    resultsDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');
    resultsDiv.innerHTML = '';

    try {
        const response = await fetch(`http://localhost:5000/twitter?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to fetch stats');

        renderStats(data);
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
    }
}

function renderStats(data) {
    let html = '';

    if (data.type === 'tweet') {
        html = `
            <div class="stat-card">
                <h3>Tweet Stats</h3>
                <div class="stat-row"><span class="label">Author</span> <span class="value">@${data.author}</span></div>
                <div class="stat-row"><span class="label">Likes</span> <span class="value">${data.likes}</span></div>
                <div class="stat-row"><span class="label">Retweets</span> <span class="value">${data.retweets}</span></div>
                <div class="stat-row"><span class="label">Replies</span> <span class="value">${data.replies}</span></div>
                <div class="stat-row"><span class="label">Views</span> <span class="value">${data.views}</span></div>
            </div>
        `;
    } else if (data.type === 'profile') {
        html = `
            <div class="stat-card">
                <h3>Profile Stats</h3>
                <div class="stat-row"><span class="label">Username</span> <span class="value">@${data.username}</span></div>
                <div class="stat-row"><span class="label">Followers</span> <span class="value">${data.followers}</span></div>
                <div class="stat-row"><span class="label">Following</span> <span class="value">${data.following}</span></div>
                <div class="stat-row"><span class="label">Tweets</span> <span class="value">${data.tweets}</span></div>
            </div>
        `;
    }

    resultsDiv.innerHTML = html;
    resultsDiv.classList.remove('hidden');
}
