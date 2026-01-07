# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from app.db import supabase
# from app.services.news_fetcher import fetch_and_store_news


# app = FastAPI(title="NovaNews Backend")

# # --- Pydantic Models ---
# class InteractionRequest(BaseModel):
#     user_id: str
#     article_id: int
#     interaction_type: str  # e.g., 'like', 'view', 'skip'

# @app.get("/")
# def read_root():
#     return {"status": "active", "message": "NovaNews API is running"}

# @app.get("/test-db")
# def test_db_connection():
#     try:
#         # Try to fetch 1 row from the 'articles' table to verify connection
#         response = supabase.table("articles").select("*").limit(1).execute()
#         return {"status": "success", "data": response.data}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
# @app.post("/update-news/{category}")
# def trigger_news_update(category: str):
#     # This calls the function we just wrote
#     result = fetch_and_store_news(category)
#     return result

# @app.post("/interact")
# def log_interaction(data: InteractionRequest):
#     try:
#         # 1. Prepare the data payload
#         interaction_entry = {
#             "user_id": data.user_id,
#             "article_id": data.article_id,
#             "interaction_type": data.interaction_type
#         }

#         # 2. Insert into Supabase
#         response = supabase.table("interactions").insert(interaction_entry).execute()
        
#         return {"status": "success", "message": "Interaction logged", "data": response.data}
    
#     except Exception as e:
#         # If something goes wrong (like a fake user_id), tell us why
#         return {"status": "error", "details": str(e)}

# # Run with: uvicorn app.main:app --reload

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.db import supabase
from app.services.news_fetcher import fetch_and_store_news

# --- NEW: Imports for AI/ML ---
from app.services.vectorizer import process_new_articles
from app.ml.recommender import get_recommendations, calculate_user_embedding

app = FastAPI(title="NovaNews Backend")

# --- Pydantic Models ---
class InteractionRequest(BaseModel):
    user_id: str
    article_id: int
    interaction_type: str  # e.g., 'like', 'view', 'skip'

# --- Existing Routes ---

@app.get("/")
def read_root():
    return {"status": "active", "message": "NovaNews API is running"}

@app.get("/test-db")
def test_db_connection():
    try:
        # Try to fetch 1 row from the 'articles' table to verify connection
        response = supabase.table("articles").select("*").limit(1).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/update-news/{category}")
def trigger_news_update(category: str):
    # This calls the news fetcher service
    result = fetch_and_store_news(category)
    return result

@app.post("/interact")
def log_interaction(data: InteractionRequest):
    try:
        # 1. Prepare the data payload
        interaction_entry = {
            "user_id": data.user_id,
            "article_id": data.article_id,
            "interaction_type": data.interaction_type
        }

        # 2. Insert into Supabase
        response = supabase.table("interactions").insert(interaction_entry).execute()
        
        return {"status": "success", "message": "Interaction logged", "data": response.data}
    
    except Exception as e:
        # If something goes wrong (like a fake user_id), tell us why
        return {"status": "error", "details": str(e)}

# --- NEW: AI / ML Routes ---

@app.post("/trigger-ml")
def trigger_ml_processing():
    """
    Manually triggers the AI to find new articles and convert them to vectors.
    """
    return process_new_articles()

@app.get("/recommend/{user_id}")
def recommend_articles(user_id: str):
    """
    Returns personalized news articles based on the user's interaction history.
    """
    try:
        # 1. Get User's History (Interactions)
        interactions = supabase.table("interactions").select("article_id").eq("user_id", user_id).execute().data
        
        # COLD START CHECK: If user has no history, return latest news
        if not interactions:
            print("Cold Start: User has no history. Returning latest news.")
            return supabase.table("articles").select("*").order("published_at", desc=True).limit(10).execute().data

        # 2. Get the embeddings of the articles they liked/viewed
        article_ids = [i['article_id'] for i in interactions]
        
        # Fetch the vectors for these articles
        liked_embeddings_data = supabase.table("article_embeddings").select("embedding").in_("article_id", article_ids).execute().data
        
        # Extract just the lists of numbers
        liked_vectors = [x['embedding'] for x in liked_embeddings_data]

        # 3. Build User Profile (Average Vector)
        user_vector = calculate_user_embedding(liked_vectors)

        # 4. Fetch ALL article embeddings to compare against
        all_embeddings = supabase.table("article_embeddings").select("*").execute().data
        
        # 5. Get Recommendations (Math Magic)
        recommendations = get_recommendations(user_vector, all_embeddings, top_k=5)

        # 6. Fetch full details for the recommended articles
        if not recommendations:
            return []
            
        rec_ids = [r['article_id'] for r in recommendations]
        
        # Fetch unsorted data from DB
        unsorted_articles = supabase.table("articles").select("*").in_("id", rec_ids).execute().data
        
        # --- FIX STARTS HERE ---
        # Create a dictionary for fast lookup: { article_id: article_data }
        article_map = {a['id']: a for a in unsorted_articles}
        
        # Re-build the list in the CORRECT order (matching rec_ids)
        final_articles = []
        for rid in rec_ids:
            if rid in article_map:
                final_articles.append(article_map[rid])
        # --- FIX ENDS HERE ---
        
        return final_articles

    except Exception as e:
        return {"error": str(e)}