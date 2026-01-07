import requests
import os
from app.db import supabase

# 1. Get the API Key safely
NEWS_API_KEY = os.environ.get("NEWS_API_KEY")
NEWS_URL = "https://newsapi.org/v2/top-headlines"

def fetch_and_store_news(category="technology"):
    """
    Fetches news from NewsAPI and stores it in Supabase.
    """
    # Safety Check
    if not NEWS_API_KEY:
        print("Error: NEWS_API_KEY not found.")
        return {"error": "News API Key missing"}

    # 2. Define the request parameters
    params = {
        "country": "us",      # Options: 'us', 'in' (India), etc.
        "category": category, # Options: technology, business, sports, health
        "apiKey": NEWS_API_KEY
    }

    print(f"Fetching {category} news...")
    
    try:
        response = requests.get(NEWS_URL, params=params)
        data = response.json()

        # Check if NewsAPI gave us an error
        if data.get("status") != "ok":
            print(f"NewsAPI Error: {data.get('message')}")
            return {"error": "Failed to fetch news", "details": data}

        articles = data.get("articles", [])
        print(f"Found {len(articles)} articles. Inserting into DB...")

        stored_count = 0

        # 3. Loop through articles and save them
        for article in articles:
            # Skip articles that were removed/invalid
            if article.get("title") == "[Removed]":
                continue

            # Prepare the data row
            new_article = {
                "title": article.get("title"),
                "description": article.get("description"),
                "content": article.get("content"),
                "url": article.get("url"),
                "image_url": article.get("urlToImage"),
                "source_name": article.get("source", {}).get("name"),
                "category": category,
                "published_at": article.get("publishedAt")
            }

            # Insert into Supabase
            try:
                # We use .insert() to add the row
                supabase.table("articles").insert(new_article).execute()
                stored_count += 1
            except Exception as e:
                # If duplicate or error, just print and continue
                print(f"Internal insert error (might be duplicate): {str(e)}")

        return {"status": "success", "stored": stored_count, "category": category}

    except Exception as e:
        return {"error": "Unexpected error", "details": str(e)}