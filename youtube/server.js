import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health Check
app.get('/', (req, res) => {
    res.sendFile(path.join(fileURLToPath(import.meta.url), '../public/index.html'));
});

app.get('/health', (req, res) => {
    res.status(200).send('Server is running');
});

// API Route
app.get('/api/video-stats', async (req, res) => {
    try {
        const { videoId } = req.query;

        if (!videoId) {
            return res.status(400).json({ error: 'Video ID is required' });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: API Key missing' });
        }

        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to fetch data from YouTube API');
        }

        if (data.items.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const video = data.items[0];
        const snippet = video.snippet;
        const statistics = video.statistics;

        const result = {
            title: snippet.title,
            channelTitle: snippet.channelTitle,
            thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url,
            publishedAt: snippet.publishedAt,
            viewCount: statistics.viewCount,
            likeCount: statistics.likeCount,
            commentCount: statistics.commentCount
        };

        res.json(result);

    } catch (error) {
        console.error('Error fetching video stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start Server with Auto-Port Selection
const startServer = (port) => {
    const server = app.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`\n✅ Server is running! Open this URL in your browser:\n👉 ${url}\n`);

        // Auto-open browser
        import('child_process').then(cp => {
            const startCmd = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
            cp.exec(`${startCmd} ${url}`);
        });
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });

    process.on('SIGINT', () => {
        server.close(() => process.exit(0));
    });
};

startServer(parseInt(PORT, 10));
