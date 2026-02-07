from campaign_model import CampaignModel
import pandas as pd

def run_analysis():
    print("Starting Campaign Analysis...")
    
    # Initialize and train model
    model = CampaignModel()
    model.load_data()
    model.train_model()
    mse, r2 = model.evaluate_model()
    
    # Feature Importance
    print("\n--- Feature Importance (Impact on Sales Uplift) ---")
    importance = model.get_feature_importance()
    print(importance)
    print("\nInterpretation:")
    print("These coefficients represent the estimated 'Dollar Value' of each unit.")
    print("For example, a coefficient of 2.5 for 'clicks' means each click adds approx $2.50 to Sales Uplift.")
    top_feature = importance.iloc[0]['Feature']
    print(f"The most influential factor is '{top_feature}'.")
    
    # Sample Prediction & ROI Analysis
    print("\n--- Sample Campaign Prediction ---")
    new_campaign = {
        'campaign_duration_days': 30,
        'influencer_count': 5,
        'campaign_cost': 5000,
        'impressions': 20000, # Estimated
        'clicks': 800,       # Estimated
        'likes': 1500,       # Estimated
        'comments': 100,     # Estimated
        'saves': 50          # Estimated
    }
    
    predicted_sales = model.predict_campaign(new_campaign)
    print(f"Predicted Sales Uplift: ${predicted_sales:.2f}")
    
    roi = model.calculate_roi(new_campaign['campaign_cost'], predicted_sales)
    print(f"Projected ROI: {roi:.2f}%")
    
    if roi > 0:
        print("Recommendation: This campaign is projected to be profitable.")
    else:
        print("Recommendation: Optimize costs or improve engagement to achieve positive ROI.")

if __name__ == "__main__":
    run_analysis()
