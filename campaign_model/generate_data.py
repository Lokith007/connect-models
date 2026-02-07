import pandas as pd
import numpy as np
import random

def generate_campaign_data(num_samples=100):
    """
    Generates a synthetic dataset for marketing campaign analysis.
    """
    np.random.seed(42)
    
    data = []
    
    for _ in range(num_samples):
        # Independent variables (Features)
        campaign_duration_days = np.random.randint(5, 60)
        influencer_count = np.random.randint(1, 20)
        campaign_cost = np.random.uniform(1000, 50000)
        
        # Engagement metrics (correlated with cost and influencers)
        base_engagement = (campaign_cost / 100) * (influencer_count * 0.5)
        
        impressions = int(base_engagement * np.random.uniform(50, 150))
        clicks = int(impressions * np.random.uniform(0.01, 0.05))
        likes = int(impressions * np.random.uniform(0.02, 0.08))
        comments = int(likes * np.random.uniform(0.05, 0.15))
        saves = int(likes * np.random.uniform(0.1, 0.3))
        
        # Dependent variable (Target): Sales Uplift
        # Formula: Base + Noise + Function of engagement
        # Let's say sales uplift is driven by Clicks and Saves more than Likes
        sales_uplift = (clicks * 2.5) + (saves * 5.0) + (likes * 0.5) + (campaign_cost * 0.1) + (campaign_duration_days * 5.0)
        sales_uplift *= np.random.uniform(0.9, 1.1) # Add some noise
        
        data.append({
            'campaign_duration_days': campaign_duration_days,
            'influencer_count': influencer_count,
            'campaign_cost': round(campaign_cost, 2),
            'impressions': impressions,
            'clicks': clicks,
            'likes': likes,
            'comments': comments,
            'saves': saves,
            'sales_uplift': round(sales_uplift, 2)
        })
        
    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    print("Generating synthetic campaign data...")
    df = generate_campaign_data()
    output_file = 'campaign_data.csv'
    df.to_csv(output_file, index=False)
    print(f"Data saved to {output_file}")
    print(df.head())
