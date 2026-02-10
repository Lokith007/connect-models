from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(title="Influencer Analysis ML API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model
MODEL_PATH = "model.joblib"
model = None

# Input Schema
class AnalysisRequest(BaseModel):
    followers: int
    views: int
    likes: int
    comments: int

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully.")
    else:
        print("Model not found. Please run train_model.py first.")
        # Optional: Auto-train if missing
        # from train_model import train
        # train()
        # model = joblib.load(MODEL_PATH)

@app.get("/")
def home():
    return {"status": "ML Server Running", "model_loaded": model is not None}

@app.post("/predict")
def predict(data: AnalysisRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded. Run train_model.py first.")
    
    # Prepare input DataFrame (names must match training)
    input_df = pd.DataFrame([{
        'followers': data.followers,
        'views': data.views,
        'likes': data.likes,
        'comments': data.comments
    }])
    
    # Predict Category
    prediction = model.predict(input_df)[0]
    probabilities = model.predict_proba(input_df)[0]
    
    # Get highest probability score
    classes = model.classes_
    confidence = max(probabilities)
    
    # Calculate simple Virality Score (0-100) based on engagement logic + model confidence
    # Heuristic: (Likes + Comments) / Views normalized 
    engagement_rate = (data.likes + data.comments) / (data.views + 1)
    # Cap at 15% for score of 100
    virality_score = min(int((engagement_rate / 0.15) * 100), 100)
    
    return {
        "category": prediction,
        "confidence": float(confidence),
        "virality_score": virality_score,
        "metrics_analyzed": {
            "er": f"{engagement_rate:.2%}"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
