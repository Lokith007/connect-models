import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

class CampaignModel:
    def __init__(self, data_path='campaign_data.csv'):
        self.data_path = data_path
        self.model = LinearRegression()
        self.features = ['campaign_duration_days', 'influencer_count', 'campaign_cost', 
                         'impressions', 'clicks', 'likes', 'comments', 'saves']
        self.target = 'sales_uplift'
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None

    def load_data(self):
        """Loads data from CSV."""
        try:
            self.df = pd.read_csv(self.data_path)
            print(f"Data loaded successfully. Shape: {self.df.shape}")
        except FileNotFoundError:
            print(f"Error: File {self.data_path} not found.")
            raise

    def train_model(self):
        """Trains the Linear Regression model."""
        if self.df is None:
            self.load_data()
        
        X = self.df[self.features]
        y = self.df[self.target]
        
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model.fit(self.X_train, self.y_train)
        print("Model trained successfully.")

    def evaluate_model(self):
        """Evaluates the model and returns metrics."""
        if self.model is None:
            print("Model not trained yet.")
            return
        
        y_pred = self.model.predict(self.X_test)
        mse = mean_squared_error(self.y_test, y_pred)
        r2 = r2_score(self.y_test, y_pred)
        
        print(f"Model Evaluation:\nMean Squared Error: {mse:.2f}\nR2 Score: {r2:.2f}")
        return mse, r2

    def get_feature_importance(self):
        """Returns feature coefficients."""
        if self.model is None:
            return {}
        
        coefficients = pd.DataFrame({
            'Feature': self.features,
            'Coefficient': self.model.coef_
        }).sort_values(by='Coefficient', ascending=False)
        
        return coefficients

    def predict_campaign(self, input_features):
        """Predicts sales uplift for a new campaign."""
        if isinstance(input_features, dict):
             input_df = pd.DataFrame([input_features])
        else:
             input_df = pd.DataFrame([input_features], columns=self.features)
             
        prediction = self.model.predict(input_df)[0]
        return prediction

    def calculate_roi(self, campaign_cost, predicted_uplift, avg_profit_per_sale=50):
        """Calculates ROI based on predicted sales uplift."""
        net_profit = predicted_uplift - campaign_cost
        roi = (net_profit / campaign_cost) * 100
        return roi
