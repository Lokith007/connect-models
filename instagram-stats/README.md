# Instagram Stats Viewer

Fetch and display Instagram profile stats using RapidAPI.

## Setup

1.  **Navigate to server:**
    ```bash
    cd connect-models/instagram-stats/server
    ```

2.  **Dependencies are installed!**
    - I ran `npm install` for you.

3.  **Configure API Host (CRITICAL):**
    - Open `.env`.
    - I have set the API Key for you.
    - **YOU MUST UPDATE `RAPIDAPI_HOST`**.
    - Go to your RapidAPI Dashboard, find the Instagram API you subscribed to, and copy the `X-RapidAPI-Host` value.
    - Paste it into `.env`.

4.  **Run Server:**
    ```bash
    node index.js
    ```
    Runs on Port **5001** (to avoid conflict with Twitter app).

5.  **Run Client:**
    - Open `client/index.html` in browser.

## Troubleshooting
- If you see "403 Forbidden" or "Not Subscribed", your `RAPIDAPI_HOST` in `.env` is wrong.
- If you see "404 Not Found", the API endpoint path in `index.js` (line 39) might need adjustment based on the specific API documentation.
