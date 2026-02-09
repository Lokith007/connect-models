const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/twitter', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        let stats = {};

        // Basic URL validation and ID extraction logic
        // This is a simplified example assuming we use a RapidAPI service 
        // that might take a screenname or tweet ID.
        // For this demo, we'll try to determine if it's a profile or a tweet.

        const isTweet = url.includes('/status/');
        const isProfile = !isTweet && url.includes('twitter.com') || url.includes('x.com');

        if (!process.env.RAPIDAPI_KEY) {
            return res.status(500).json({ error: 'Server API key not configured' });
        }

        const headers = {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
        };

        // Note: The specific endpoints depend heavily on which RapidAPI service is used.
        // "Twitter API 45" or "Twitter Web API" are common ones.
        // We will implement a generic handler assuming 'Twitter API 45' style endpoints for demo.

        if (isTweet) {
            // Extract Tweet ID
            // format: https://x.com/username/status/1234567890...
            const match = url.match(/status\/(\d+)/);
            if (!match) return res.status(400).json({ error: 'Invalid Tweet URL' });
            const tweetId = match[1];

            const response = await axios.get(`https://${process.env.RAPIDAPI_HOST}/tweet.php`, {
                params: { id: tweetId },
                headers: headers
            });

            // Transform response to a clean format
            // Adjust this mapping based on the actual API response structure
            const data = response.data;
            stats = {
                type: 'tweet',
                id: tweetId,
                likes: data.likes || data.favorite_count || 0,
                retweets: data.retweets || data.retweet_count || 0,
                replies: data.replies || data.reply_count || 0,
                views: data.views || data.view_count || 'N/A',
                text: data.text || data.full_text,
                author: data.user ? data.user.screen_name : 'Unknown'
            };

        } else if (isProfile) {
            // Extract Username
            // format: https://x.com/username
            const match = url.match(/x\.com\/([a-zA-Z0-9_]+)/) || url.match(/twitter\.com\/([a-zA-Z0-9_]+)/);
            if (!match) return res.status(400).json({ error: 'Invalid Profile URL' });
            const username = match[1];

            const response = await axios.get(`https://${process.env.RAPIDAPI_HOST}/screenname.php`, {
                params: { screenname: username },
                headers: headers
            });

            const data = response.data;
            stats = {
                type: 'profile',
                username: data.screen_name || username,
                followers: data.followers_count || data.sub_count || 0,
                following: data.friends_count || 0,
                tweets: data.statuses_count || 0,
                description: data.description || ''
            };
        } else {
            return res.status(400).json({ error: 'Could not determine if URL is tweet or profile' });
        }

        res.json(stats);

    } catch (error) {
        console.error('API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: 'Failed to fetch data',
            details: error.response ? error.response.data : error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
