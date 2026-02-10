import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

# 1. Generate Synthetic Data
# We simulate social media posts to train the model to recognize "Viral" vs "Average" patterns.
def generate_data(n_samples=2000):
    np.random.seed(42)
    
    # Features
    followers = np.random.randint(100, 1000000, n_samples)
    views = np.random.randint(10, 5000000, n_samples)
    
    # Likes correlate with views but with noise
    likes = (views * np.random.uniform(0.01, 0.15, n_samples)).astype(int)
    
    # Comments correlate with likes
    comments = (likes * np.random.uniform(0.01, 0.10, n_samples)).astype(int)
    
    df = pd.DataFrame({
        'followers': followers,
        'views': views,
        'likes': likes,
        'comments': comments
    })
    
    # 2. Define "Labels" based on rules (Ground Truth for our synthetic model)
    # We calculate Engagement Rate (ER) = (Likes + Comments) / Views
    # (Using Views as base for content performance, Followers for reach context)
    
    df['engagement_rate'] = (df['likes'] + df['comments']) / (df['views'] + 1)
    
    conditions = [
        (df['engagement_rate'] > 0.10) & (df['views'] > 10000), # Viral: High ER + Significant Views
        (df['engagement_rate'] > 0.05),                         # High Engagement
        (df['engagement_rate'] > 0.01)                          # Average
    ]
    choices = ['Viral', 'High Engagement', 'Average']
    
    df['category'] = np.select(conditions, choices, default='Low Performance')
    
    return df

def train():
    print("Generating synthetic data...")
    df = generate_data()
    
    X = df[['followers', 'views', 'likes', 'comments']]
    y = df['category']
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluate
    print("Model Evaluation:")
    print(classification_report(y_test, clf.predict(X_test)))
    
    # Save
    joblib.dump(clf, 'model.joblib')
    print("Model saved to model.joblib")

if __name__ == "__main__":
    train()
