
// Helper for number formatting
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
}

// Helper for Ports
function getPorts() {
    return {
        twitter: document.getElementById('port-twitter').value || 5000,
        instagram: document.getElementById('port-instagram').value || 5001,
        youtube: document.getElementById('port-youtube').value || 3000
    };
}

// Helper to sanitize numbers
function sanitize(val) {
    // If val is string '1.2K', we need to be careful. 
    // Here we assume the API returns numbers. If 'N/A' or strings, treat as 0.
    const num = parseInt(val);
    return isNaN(num) ? 0 : num;
}

// --- CALL ML SERVICE ---
async function analyzeML(followers, views, likes, comments) {
    const mlSection = document.getElementById('ml-section');
    const mlScore = document.getElementById('ml-score');
    const mlCategory = document.getElementById('ml-category');
    const mlConfidence = document.getElementById('ml-confidence');

    // Default values if missing
    const payload = {
        followers: sanitize(followers) || 1000, // assume rough default for context
        views: sanitize(views),
        likes: sanitize(likes),
        comments: sanitize(comments)
    };

    // ML Port is hardcoded to 8000 for now as per plan
    const ML_PORT = 8000;

    try {
        const response = await fetch(`http://localhost:${ML_PORT}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("ML Service Error");

        const data = await response.json();

        // Update UI
        mlSection.classList.remove('hidden');

        // Animate Score
        mlScore.textContent = data.virality_score;
        document.querySelector('.score-circle').style.setProperty('--score', `${data.virality_score * 3.6}deg`);

        mlCategory.textContent = data.category;
        mlConfidence.textContent = (data.confidence * 100).toFixed(1) + '%';

    } catch (error) {
        console.error("ML Error:", error);
        // Fail silently or show minimal error in console, don't break main dashboard
    }
}


// --- TWITTER ANALYSIS ---
async function analyzeTwitter() {
    const input = document.getElementById('twitter-input').value.trim();
    if (!input) return;

    const results = document.getElementById('twitter-results');
    const error = document.getElementById('t-error');
    const ports = getPorts();

    results.classList.add('hidden');
    error.classList.add('hidden');

    try {
        const response = await fetch(`http://localhost:${ports.twitter}/twitter?url=${encodeURIComponent(input)}`);
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // Render
        document.getElementById('t-type').textContent = data.type;
        document.getElementById('t-handle').textContent = `@${data.author || data.username}`;

        let m1 = 0, m2 = 0, m3 = 0, engagement = 0;

        if (data.type === 'tweet') {
            m1 = data.likes;
            m2 = data.retweets;
            m3 = data.replies;
            document.querySelector('#t-m1 + .lbl').textContent = 'Likes';
            document.querySelector('#t-m2 + .lbl').textContent = 'Retweets';
            document.querySelector('#t-m3 + .lbl').textContent = 'Replies';

            const totalInteractions = parseInt(m1) + parseInt(m2) + parseInt(m3);
            const views = parseInt(data.views) || 0;
            if (views > 0) {
                engagement = ((totalInteractions / views) * 100).toFixed(2) + '% (of views)';
            } else {
                engagement = totalInteractions + ' Interactions';
            }

            // Trigger ML
            analyzeML(0, views, m1, m3); // 0 followers context for now

        } else {
            // Profile
            m1 = data.followers;
            m2 = data.following;
            m3 = data.tweets;
            document.querySelector('#t-m1 + .lbl').textContent = 'Followers';
            document.querySelector('#t-m2 + .lbl').textContent = 'Following';
            document.querySelector('#t-m3 + .lbl').textContent = 'Tweets';

            engagement = 'N/A (Profile View)';
            // No ML for profile yet, only content
        }

        document.getElementById('t-m1').textContent = formatNumber(m1);
        document.getElementById('t-m2').textContent = formatNumber(m2);
        document.getElementById('t-m3').textContent = formatNumber(m3);
        document.getElementById('t-eng').textContent = engagement;

        results.classList.remove('hidden');

    } catch (err) {
        error.textContent = err.message;
        error.classList.remove('hidden');
    }
}

// --- INSTAGRAM ANALYSIS ---
async function analyzeInstagram() {
    const input = document.getElementById('insta-input').value.trim();
    if (!input) return;

    const results = document.getElementById('insta-results');
    const error = document.getElementById('i-error');
    const ports = getPorts();

    results.classList.add('hidden');
    error.classList.add('hidden');

    try {
        const response = await fetch(`http://localhost:${ports.instagram}/instagram?username=${encodeURIComponent(input)}`);
        const data = await response.json();

        if (data.error) throw new Error(data.message || 'Error fetching Instagram data');

        // Render
        document.getElementById('i-pic').src = data.profile_pic_url || '';
        document.getElementById('i-handle').textContent = `@${data.username}`;

        document.getElementById('i-followers').textContent = formatNumber(data.followers);
        document.getElementById('i-following').textContent = formatNumber(data.following);
        document.getElementById('i-posts').textContent = formatNumber(data.posts);

        const followers = parseInt(data.followers) || 0;
        const following = parseInt(data.following) || 1;
        const ratio = (followers / following).toFixed(2);

        document.getElementById('i-ratio').textContent = ratio + 'x';
        document.querySelector('#insta-results .eng-label').textContent = 'Follower/Following Ratio';

        results.classList.remove('hidden');

        // No ML for profile summary unless we have average likes/post which we don't from this endpoint

    } catch (err) {
        error.textContent = err.message;
        error.classList.remove('hidden');
    }
}

// --- YOUTUBE ANALYSIS ---
async function analyzeYouTube() {
    const input = document.getElementById('yt-input').value.trim();
    if (!input) return;

    const results = document.getElementById('yt-results');
    const error = document.getElementById('y-error');
    const ports = getPorts();

    results.classList.add('hidden');
    error.classList.add('hidden');

    let videoId = '';
    try {
        const urlObj = new URL(input);
        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        } else if (urlObj.hostname.includes('youtu.be')) {
            videoId = urlObj.pathname.slice(1);
        }
    } catch (e) {
        videoId = input;
    }

    if (!videoId) {
        error.textContent = "Invalid Video URL";
        error.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch(`http://localhost:${ports.youtube}/api/video-stats?videoId=${videoId}`);
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        document.getElementById('y-thumb').src = data.thumbnailUrl;
        document.getElementById('y-title').textContent = data.title;
        document.getElementById('y-channel').textContent = data.channelTitle;

        document.getElementById('y-views').textContent = formatNumber(data.viewCount);
        document.getElementById('y-likes').textContent = formatNumber(data.likeCount);
        document.getElementById('y-comments').textContent = formatNumber(data.commentCount);

        const views = parseInt(data.viewCount) || 1;
        const likes = parseInt(data.likeCount) || 0;
        const ratio = ((likes / views) * 100).toFixed(2);

        document.getElementById('y-ratio').textContent = ratio + '%';

        results.classList.remove('hidden');

        // Trigger ML
        analyzeML(0, views, likes, parseInt(data.commentCount));

    } catch (err) {
        error.textContent = err.message;
        error.classList.remove('hidden');
    }
}
