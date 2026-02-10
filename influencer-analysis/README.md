# Influencer Analysis Dashboard & ML Service

A unified dashboard to analyze content from Twitter, Instagram, and YouTube, powered by a Machine Learning model.

## Prerequisites

You must have **ALL 4 SERVERS** running in separate terminals.

### 1. Social Collectors (Node.js)
*   **Twitter (Port 5000):** `cd twitter-stats/server && node index.js`
*   **Instagram (Port 5001):** `cd instagram-stats/server && node index.js`
*   **YouTube (Port 3000):** `cd youtube && node server.js`

### 2. ML Service (Python)
*   **Navigate:** `cd influencer-analysis/ml-server`
*   **Install:** 
    ```bash
    pip install -r requirements.txt
    ```
*   **Train Model (First Time Only):**
    ```bash
    python train_model.py
    ```
*   **Run Server (Port 8000):**
    ```bash
    python main.py
    ```

## Usage

1.  Open `influencer-analysis/client/index.html`.
2.  Enter a Tweet or YouTube URL.
3.  The dashboard will fetch stats AND send them to the ML model.
4.  See the **AI Content Analysis** card appear with a Virality Score and category.
