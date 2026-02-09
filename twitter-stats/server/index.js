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
        const isTweet = url.includes('/status/');
        const isProfile = !isTweet && (url.includes('twitter.com') || url.includes('x.com'));

        if (!process.env.RAPIDAPI_KEY) {
            return res.status(500).json({ error: 'Server API key not configured' });
        }

        const headers = {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
            'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
        };

        // Determine likely endpoint based on URL structure
        // If the user is using a "Timeline" style API, the endpoint might differ.
        // We stick to the generic endpoints assumption but add robust parsing.

        let apiUrl = '';
        let params = {};

        if (isTweet) {
            const match = url.match(/status\/(\d+)/);
            if (!match) return res.status(400).json({ error: 'Invalid Tweet URL' });
            const tweetId = match[1];

            // Try generic endpoints often found in these APIs
            // The user might have changed the host which changes the paths
            apiUrl = `https://${process.env.RAPIDAPI_HOST}/tweet.php`;
            params = { id: tweetId };
        } else if (isProfile) {
            const match = url.match(/x\.com\/([a-zA-Z0-9_]+)/) || url.match(/twitter\.com\/([a-zA-Z0-9_]+)/);
            if (!match) return res.status(400).json({ error: 'Invalid Profile URL' });
            const username = match[1];

            apiUrl = `https://${process.env.RAPIDAPI_HOST}/screenname.php`;
            params = { screenname: username };
        } else {
            return res.status(400).json({ error: 'Could not determine if URL is tweet or profile' });
        }

        console.log(`Fetching from: ${apiUrl} with params:`, params);

        let data = {};
        try {
            const response = await axios.get(apiUrl, {
                params: params,
                headers: headers
            });
            data = response.data;
        } catch (fetchError) {
            console.error('Fetch Error:', fetchError.message);
            // If the endpoint failed (404/500), maybe try a different one? 
            // For now just error out but log details.
            throw fetchError;
        }

        console.log("Raw API Response Type:", typeof data);

        let stats = null;

        // --- PARSING LOGIC ---

        // 1. Try strict "Legacy" / Simple format (e.g. Twitter API 45)
        if (isTweet && (data.likes || data.favorite_count)) {
            stats = {
                type: 'tweet',
                id: params.id,
                likes: data.likes || data.favorite_count || 0,
                retweets: data.retweets || data.retweet_count || 0,
                replies: data.replies || data.reply_count || 0,
                views: data.views || data.view_count || 'N/A',
                text: data.text || data.full_text,
                author: data.user ? data.user.screen_name : 'Unknown'
            };
        } else if (isProfile && (data.followers_count || data.sub_count)) {
            stats = {
                type: 'profile',
                username: data.screen_name || params.screenname,
                followers: data.followers_count || data.sub_count || 0,
                following: data.friends_count || 0,
                tweets: data.statuses_count || 0,
                description: data.description || ''
            };
        }

        // 2. Try Complex GraphQL Format (e.g. "Helio", "Twitter Web API")
        if (!stats) {
            // Check for Profile (UserByScreenName)
            const userResult = data?.data?.user?.result || data?.user?.result;
            if (userResult && userResult.legacy) {
                const legacy = userResult.legacy;
                stats = {
                    type: 'profile',
                    username: legacy.screen_name || params.screenname,
                    followers: legacy.followers_count,
                    following: legacy.friends_count,
                    tweets: legacy.statuses_count,
                    description: legacy.description || ''
                };
            }

            // Check for Tweet (TweetDetail)
            const tweetResult = data?.data?.tweetResult?.result || data?.tweetResult?.result;
            if (tweetResult && tweetResult.legacy) {
                const legacy = tweetResult.legacy;
                const user = tweetResult.core?.user_results?.result?.legacy || {};
                const views = tweetResult.views?.count || 'N/A';

                stats = {
                    type: 'tweet',
                    id: legacy.id_str,
                    likes: legacy.favorite_count,
                    retweets: legacy.retweet_count,
                    replies: legacy.reply_count,
                    views: views,
                    text: legacy.full_text,
                    author: user.screen_name || 'Unknown'
                };
            }
        }

        if (!stats) {
            console.error('Failed to parse API response:', JSON.stringify(data, null, 2));
            return res.status(500).json({
                error: 'Unknown API response format. Check server logs for raw data.',
                details: 'The API returned data, but we could not find the stats in the expected structure. See terminal for full JSON.'
            });
        }

        res.json(stats);

    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
            return res.status(error.response.status).json({
                error: 'API request failed',
                details: error.response.data
            });
        }
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
