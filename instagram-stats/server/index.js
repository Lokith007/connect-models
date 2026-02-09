const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001; // Usage port 5001 to avoid conflict with Twitter app

app.use(cors());
app.use(express.json());

// Routes
app.get('/instagram', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    if (!process.env.RAPIDAPI_KEY) {
        return res.status(500).json({ error: 'Server API key not configured' });
    }

    const headers = {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
    };

    try {
        console.log(`Fetching Instagram stats for: ${username}`);

        // Note: Endpoint depends on the specific RapidAPI service.
        // Common pattern: /ig/info, /user/info, /account_info
        // We will assume a generic path like '/ig/info_username' or similar meant for "Instagram Scraper 2022" 
        // OR "Instagram Data" APIs. 
        // ADJUST THIS PATH based on the actual API documentation you subscribe to.

        const apiUrl = `https://${process.env.RAPIDAPI_HOST}/ig/info_username/`;

        const response = await axios.get(apiUrl, {
            params: { user: username }, // Some APIs use 'username', some 'user'
            headers: headers
        });

        const data = response.data;
        console.log("Raw API Response:", JSON.stringify(data).substring(0, 200) + "...");

        // Parser Logic - attempting to handle common structures
        let stats = null;

        // Structure A: { user: { ... } }
        if (data.user) {
            stats = {
                username: data.user.username,
                full_name: data.user.full_name,
                biography: data.user.biography,
                followers: data.user.follower_count || data.user.followers,
                following: data.user.following_count || data.user.following,
                posts: data.user.media_count || data.user.posts,
                is_private: data.user.is_private,
                profile_pic_url: data.user.profile_pic_url || data.user.hd_profile_pic_url_info?.url
            };
        }
        // Structure B: { data: { user: { ... } } }
        else if (data.data && data.data.user) {
            stats = {
                username: data.data.user.username,
                full_name: data.data.user.full_name,
                biography: data.data.user.biography,
                followers: data.data.user.edge_followed_by?.count,
                following: data.data.user.edge_follow?.count,
                posts: data.data.user.edge_owner_to_timeline_media?.count,
                is_private: data.data.user.is_private,
                profile_pic_url: data.data.user.profile_pic_url_hd
            };
        }

        if (!stats) {
            // Fallback: send raw data if we can't parse it, so user sees something
            console.warn("Could not parse specific stats, sending raw data");
            return res.json({
                warning: "Could not parse standard stats. Raw response below.",
                raw: data
            });
        }

        res.json(stats);

    } catch (error) {
        console.error('API Error:', error.message);
        if (error.response) {
            console.error('API Response Data:', JSON.stringify(error.response.data, null, 2));
            return res.status(error.response.status).json({
                error: 'API request failed',
                message: error.response.data.message || error.response.statusText,
                details: error.response.data
            });
        }
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Instagram Server running on http://localhost:${PORT}`);
});
