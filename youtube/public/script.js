const videoUrlInput = document.getElementById('videoUrl');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultCard = document.getElementById('resultCard');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// Check if running on file protocol
if (window.location.protocol === 'file:') {
    const msg = "⚠️ You opened this file directly! Please use the localhost URL (e.g., http://localhost:3001) from your terminal.";
    alert(msg);
    showError(msg);
    analyzeBtn.disabled = true;
    videoUrlInput.disabled = true;
}

// Elements to populate
const thumbnail = document.getElementById('thumbnail');
const videoTitle = document.getElementById('videoTitle');
const channelName = document.getElementById('channelName');
const viewCount = document.getElementById('viewCount');
const likeCount = document.getElementById('likeCount');
const commentCount = document.getElementById('commentCount');
const publishedDate = document.getElementById('publishedDate');

analyzeBtn.addEventListener('click', analyzeVideo);
videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeVideo();
});

async function analyzeVideo() {
    const url = videoUrlInput.value.trim();

    if (!url) {
        showError('Please enter a YouTube URL');
        return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        showError('Invalid YouTube URL. Please check and try again.');
        return;
    }

    // Reset UI
    showError(null);
    resultCard.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
        const response = await fetch(`/api/video-stats?videoId=${videoId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch data');
        }

        displayData(data);
    } catch (err) {
        showError(err.message);
    } finally {
        loading.classList.add('hidden');
    }
}

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function displayData(data) {
    thumbnail.src = data.thumbnailUrl;
    videoTitle.textContent = data.title;
    channelName.textContent = data.channelTitle;

    viewCount.textContent = formatNumber(data.viewCount);
    likeCount.textContent = formatNumber(data.likeCount);
    commentCount.textContent = formatNumber(data.commentCount);

    const date = new Date(data.publishedAt);
    publishedDate.textContent = date.toLocaleDateString();

    resultCard.classList.remove('hidden');
}

function formatNumber(num) {
    if (!num) return '0';
    return parseInt(num).toLocaleString();
}

function showError(message) {
    if (message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        errorDiv.classList.add('hidden');
    }
}
