from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from app.db import supabase
from app.services.news_fetcher import fetch_and_store_news
from app.services.vectorizer import process_new_articles
from app.ml.recommender import get_recommendations, calculate_user_embedding


app = FastAPI(title="NovaNews Backend")


# -------------------- CORS --------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------- Models --------------------
class InteractionRequest(BaseModel):
    user_id: str
    article_id: int
    interaction_type: str


# -------------------- Root --------------------
@app.get("/")
def root():
    return {"status": "active", "message": "NovaNews API is running"}


# -------------------- Get All Articles --------------------
@app.get("/articles")
def get_articles(category: Optional[str] = "All"):
    try:
        query = supabase.table("articles").select("*")

        if category and category.lower() != "all":
            query = query.eq("category", category.lower())

        response = query.order("published_at", desc=True).execute()
        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- Get Single Article --------------------
@app.get("/articles/{article_id}")
def get_article(article_id: int):
    try:
        response = (
            supabase
            .table("articles")
            .select("*")
            .eq("id", article_id)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Article not found")

        return response.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- Log Interaction --------------------
@app.post("/interact")
def log_interaction(data: InteractionRequest):
    try:
        print(f">>> RECEIVED: user={data.user_id}, article={data.article_id}, type={data.interaction_type}")

        # ── Dislike logic ──────────────────────────────────────────────────────
        # When a user dislikes an article:
        #   1. Delete any existing "like" row for this (user, article) pair
        #   2. Insert a fresh "dislike" row
        # This keeps the table clean — no stale "like" left alongside a "dislike".
        if data.interaction_type == "dislike":
            supabase.table("interactions").delete().match({
                "user_id": data.user_id,
                "article_id": data.article_id,
                "interaction_type": "like",
            }).execute()

            supabase.table("interactions").insert({
                "user_id": data.user_id,
                "article_id": data.article_id,
                "interaction_type": "dislike",
            }).execute()

            return {"status": "success", "message": "Dislike recorded (like removed if present)"}

        # ── Unlike logic ───────────────────────────────────────────────────────
        # When a user un-likes, delete the "like" row entirely.
        if data.interaction_type == "unlike":
            supabase.table("interactions").delete().match({
                "user_id": data.user_id,
                "article_id": data.article_id,
                "interaction_type": "like",
            }).execute()

            return {"status": "success", "message": "Like removed"}

        # ── Unsave logic ───────────────────────────────────────────────────────
        if data.interaction_type == "unsave":
            supabase.table("interactions").delete().match({
                "user_id": data.user_id,
                "article_id": data.article_id,
                "interaction_type": "save",
            }).execute()

            return {"status": "success", "message": "Save removed"}

        # ── All other interactions (like, save, view, share) ───────────────────
        # Use upsert to avoid duplicates for idempotent actions.
        response = supabase.table("interactions").upsert({
            "user_id": data.user_id,
            "article_id": data.article_id,
            "interaction_type": data.interaction_type,
        }, on_conflict="user_id,article_id,interaction_type").execute()

        print(f">>> SUPABASE RESPONSE: {response}")
        return {"status": "success", "message": "Interaction logged"}

    except Exception as e:
        print(f">>> FULL ERROR: {repr(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- Get User Interactions --------------------
@app.get("/interactions/{user_id}")
def get_user_interactions(user_id: str):
    try:
        response = (
            supabase
            .table("interactions")
            .select("article_id, interaction_type")
            .eq("user_id", user_id)
            .in_("interaction_type", ["like", "save", "dislike"])
            .execute()
        )

        liked = []
        saved = []
        disliked = []

        for row in response.data:
            if row["interaction_type"] == "like":
                liked.append(row["article_id"])
            elif row["interaction_type"] == "save":
                saved.append(row["article_id"])
            elif row["interaction_type"] == "dislike":
                disliked.append(row["article_id"])

        return {
            "liked": list(set(liked)),
            "saved": list(set(saved)),
            "disliked": list(set(disliked)),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- Get User Profile --------------------
@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    """Returns user details + interaction stats."""
    try:
        # User record
        user_resp = (
            supabase
            .table("users")
            .select("id, email, name, profile_pic, created_at")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not user_resp.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = user_resp.data

        # Interaction counts
        interactions_resp = (
            supabase
            .table("interactions")
            .select("interaction_type")
            .eq("user_id", user_id)
            .execute()
        )
        counts = {"like": 0, "save": 0, "view": 0, "share": 0, "dislike": 0}
        for row in interactions_resp.data:
            t = row["interaction_type"]
            if t in counts:
                counts[t] += 1

        return {
            **user,
            "stats": {
                "liked": counts["like"],
                "saved": counts["save"],
                "viewed": counts["view"],
                "shared": counts["share"],
                "disliked": counts["dislike"],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- Get User Saved Articles --------------------
@app.get("/profile/{user_id}/saved")
def get_saved_articles(user_id: str):
    """Returns full article objects the user has saved."""
    try:
        saved_resp = (
            supabase
            .table("interactions")
            .select("article_id")
            .eq("user_id", user_id)
            .eq("interaction_type", "save")
            .execute()
        )

        article_ids = list(set([row["article_id"] for row in saved_resp.data]))
        if not article_ids:
            return []

        articles_resp = (
            supabase
            .table("articles")
            .select("*")
            .in_("id", article_ids)
            .order("published_at", desc=True)
            .execute()
        )

        return articles_resp.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -------------------- Trigger News Fetch --------------------
@app.post("/update-news/{category}")
def trigger_news_update(category: str):
    return fetch_and_store_news(category)


# -------------------- Trigger ML Vector Processing --------------------
@app.post("/trigger-ml")
def trigger_ml_processing():
    return process_new_articles()


# -------------------- Recommend Articles --------------------
@app.get("/recommend/{user_id}")
def recommend(user_id: str):
    try:
        # Fetch all interactions to decide strategy
        interactions_resp = (
            supabase
            .table("interactions")
            .select("article_id, interaction_type")
            .eq("user_id", user_id)
            .execute()
        )
        interactions = interactions_resp.data

        # No history → return latest articles
        if not interactions:
            return (
                supabase
                .table("articles")
                .select("*")
                .order("published_at", desc=True)
                .limit(20)
                .execute()
            ).data

        # Positive signals: like, save, view, share
        # Negative signals: dislike — we track these to EXCLUDE from results
        POSITIVE = {"like", "save", "view", "share"}
        NEGATIVE = {"dislike"}

        positive_ids = list(set([
            i["article_id"] for i in interactions
            if i["interaction_type"] in POSITIVE
        ]))
        disliked_ids = list(set([
            i["article_id"] for i in interactions
            if i["interaction_type"] in NEGATIVE
        ]))

        if not positive_ids:
            return (
                supabase
                .table("articles")
                .select("*")
                .order("published_at", desc=True)
                .limit(20)
                .execute()
            ).data

        # Attempt ML vector-based recommendations using positive interactions
        liked_embeddings_data = (
            supabase
            .table("article_embeddings")
            .select("embedding")
            .in_("article_id", positive_ids)
            .execute()
        ).data

        if liked_embeddings_data:
            liked_vectors = [x["embedding"] for x in liked_embeddings_data]
            user_vector = calculate_user_embedding(liked_vectors)

            all_embeddings = (
                supabase
                .table("article_embeddings")
                .select("*")
                .execute()
            ).data

            # Filter out embeddings for disliked articles before scoring
            if disliked_ids:
                all_embeddings = [
                    e for e in all_embeddings
                    if e["article_id"] not in disliked_ids
                ]

            recommendations = get_recommendations(user_vector, all_embeddings, top_k=20)

            if recommendations:
                rec_ids = [r["article_id"] for r in recommendations]
                unsorted_articles = (
                    supabase
                    .table("articles")
                    .select("*")
                    .in_("id", rec_ids)
                    .execute()
                ).data

                article_map = {a["id"]: a for a in unsorted_articles}
                return [article_map[rid] for rid in rec_ids if rid in article_map]

        # Fallback → category-based recommendations (excluding disliked)
        liked_articles = (
            supabase
            .table("articles")
            .select("category")
            .in_("id", positive_ids)
            .execute()
        ).data

        liked_categories = list(set([a["category"] for a in liked_articles]))

        query = (
            supabase
            .table("articles")
            .select("*")
            .in_("category", liked_categories)
            .order("published_at", desc=True)
            .limit(20)
        )

        results = query.execute().data

        # Manually exclude disliked articles in fallback path
        if disliked_ids:
            results = [a for a in results if a["id"] not in disliked_ids]

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# #main.py
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional
# from app.db import supabase
# from app.services.news_fetcher import fetch_and_store_news
# from app.services.vectorizer import process_new_articles
# from app.ml.recommender import get_recommendations, calculate_user_embedding


# app = FastAPI(title="NovaNews Backend")


# # -------------------- CORS --------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # -------------------- Models --------------------
# class InteractionRequest(BaseModel):
#     user_id: str
#     article_id: int
#     interaction_type: str


# # -------------------- Root --------------------
# @app.get("/")
# def root():
#     return {"status": "active", "message": "NovaNews API is running"}


# # -------------------- Get All Articles --------------------
# @app.get("/articles")
# def get_articles(category: Optional[str] = "All"):
#     try:
#         query = supabase.table("articles").select("*")

#         if category and category.lower() != "all":
#             query = query.eq("category", category.lower())

#         response = query.order("published_at", desc=True).execute()
#         return response.data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Get Single Article --------------------
# @app.get("/articles/{article_id}")
# def get_article(article_id: int):
#     try:
#         response = (
#             supabase
#             .table("articles")
#             .select("*")
#             .eq("id", article_id)
#             .single()
#             .execute()
#         )

#         if not response.data:
#             raise HTTPException(status_code=404, detail="Article not found")

#         return response.data

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Log Interaction --------------------
# @app.post("/interact")
# def log_interaction(data: InteractionRequest):
#     try:
#         print(f">>> RECEIVED: user={data.user_id}, article={data.article_id}, type={data.interaction_type}")
        
#         response = supabase.table("interactions").upsert({
#             "user_id": data.user_id,
#             "article_id": data.article_id,
#             "interaction_type": data.interaction_type
#         }, on_conflict="user_id,article_id,interaction_type").execute()

#         print(f">>> SUPABASE RESPONSE: {response}")
#         print(f">>> RESPONSE DATA: {response.data}")
        
#         return {"status": "success", "message": "Interaction logged"}

#     except Exception as e:
#         print(f">>> FULL ERROR: {repr(e)}")
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Get User Interactions --------------------
# # Returns sets of liked and saved article IDs for a user
# # Used by frontend to restore like/save state on page load
# @app.get("/interactions/{user_id}")
# def get_user_interactions(user_id: str):
#     try:
#         response = (
#             supabase
#             .table("interactions")
#             .select("article_id, interaction_type")
#             .eq("user_id", user_id)
#             .in_("interaction_type", ["like", "save"])
#             .execute()
#         )

#         liked = []
#         saved = []

#         for row in response.data:
#             if row["interaction_type"] == "like":
#                 liked.append(row["article_id"])
#             elif row["interaction_type"] == "save":
#                 saved.append(row["article_id"])

#         # Deduplicate in case of duplicates before unique index was enforced
#         return {
#             "liked": list(set(liked)),
#             "saved": list(set(saved))
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Trigger News Fetch --------------------
# @app.post("/update-news/{category}")
# def trigger_news_update(category: str):
#     return fetch_and_store_news(category)


# # -------------------- Trigger ML Vector Processing --------------------
# @app.post("/trigger-ml")
# def trigger_ml_processing():
#     return process_new_articles()


# # -------------------- Recommend Articles --------------------
# @app.get("/recommend/{user_id}")
# def recommend(user_id: str):
#     try:
#         interactions = (
#             supabase
#             .table("interactions")
#             .select("article_id")
#             .eq("user_id", user_id)
#             .execute()
#         ).data

#         # No history → return latest articles
#         if not interactions:
#             return (
#                 supabase
#                 .table("articles")
#                 .select("*")
#                 .order("published_at", desc=True)
#                 .limit(20)
#                 .execute()
#             ).data

#         article_ids = [i["article_id"] for i in interactions]

#         # Attempt ML vector-based recommendations
#         liked_embeddings_data = (
#             supabase
#             .table("article_embeddings")
#             .select("embedding")
#             .in_("article_id", article_ids)
#             .execute()
#         ).data

#         if liked_embeddings_data:
#             liked_vectors = [x["embedding"] for x in liked_embeddings_data]
#             user_vector = calculate_user_embedding(liked_vectors)

#             all_embeddings = (
#                 supabase
#                 .table("article_embeddings")
#                 .select("*")
#                 .execute()
#             ).data

#             recommendations = get_recommendations(user_vector, all_embeddings, top_k=10)

#             if recommendations:
#                 rec_ids = [r["article_id"] for r in recommendations]
#                 unsorted_articles = (
#                     supabase
#                     .table("articles")
#                     .select("*")
#                     .in_("id", rec_ids)
#                     .execute()
#                 ).data

#                 article_map = {a["id"]: a for a in unsorted_articles}
#                 return [article_map[rid] for rid in rec_ids if rid in article_map]

#         # Fallback → category-based recommendations
#         liked_articles = (
#             supabase
#             .table("articles")
#             .select("category")
#             .in_("id", article_ids)
#             .execute()
#         ).data

#         liked_categories = list(set([a["category"] for a in liked_articles]))

#         return (
#             supabase
#             .table("articles")
#             .select("*")
#             .in_("category", liked_categories)
#             .order("published_at", desc=True)
#             .limit(20)
#             .execute()
#         ).data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))








# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import Optional
# from app.db import supabase
# from app.services.news_fetcher import fetch_and_store_news
# from app.services.vectorizer import process_new_articles
# from app.ml.recommender import get_recommendations, calculate_user_embedding


# app = FastAPI(title="NovaNews Backend")


# # -------------------- CORS --------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # -------------------- Models --------------------
# class InteractionRequest(BaseModel):
#     user_id: str
#     article_id: int
#     interaction_type: str


# # -------------------- Root --------------------
# @app.get("/")
# def root():
#     return {"status": "active", "message": "NovaNews API is running"}


# # -------------------- Get All Articles --------------------
# @app.get("/articles")
# def get_articles(category: Optional[str] = "All"):
#     try:
#         query = supabase.table("articles").select("*")

#         if category and category.lower() != "all":
#             query = query.eq("category", category.lower())

#         response = query.order("published_at", desc=True).execute()

#         return response.data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Get Single Article --------------------
# @app.get("/articles/{article_id}")
# def get_article(article_id: int):
#     try:
#         response = (
#             supabase
#             .table("articles")
#             .select("*")
#             .eq("id", article_id)
#             .single()
#             .execute()
#         )

#         if not response.data:
#             raise HTTPException(status_code=404, detail="Article not found")

#         return response.data

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Log Interaction --------------------
# @app.post("/interact")
# def log_interaction(data: InteractionRequest):
#     try:
#         response = supabase.table("interactions").insert({
#             "user_id": data.user_id,
#             "article_id": data.article_id,
#             "interaction_type": data.interaction_type
#         }).execute()

#         return {"status": "success", "message": "Interaction logged"}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Trigger News Fetch --------------------
# @app.post("/update-news/{category}")
# def trigger_news_update(category: str):
#     return fetch_and_store_news(category)


# # -------------------- Trigger ML Vector Processing --------------------
# @app.post("/trigger-ml")
# def trigger_ml_processing():
#     return process_new_articles()


# # -------------------- Recommend Articles --------------------
# @app.get("/recommend/{user_id}")
# def recommend(user_id: str):
#     try:
#         interactions = (
#             supabase
#             .table("interactions")
#             .select("article_id")
#             .eq("user_id", user_id)
#             .execute()
#         ).data

#         # No history → return latest articles
#         if not interactions:
#             return (
#                 supabase
#                 .table("articles")
#                 .select("*")
#                 .order("published_at", desc=True)
#                 .limit(20)
#                 .execute()
#             ).data

#         article_ids = [i["article_id"] for i in interactions]

#         # Attempt ML vector-based recommendations
#         liked_embeddings_data = (
#             supabase
#             .table("article_embeddings")
#             .select("embedding")
#             .in_("article_id", article_ids)
#             .execute()
#         ).data

#         if liked_embeddings_data:
#             liked_vectors = [x["embedding"] for x in liked_embeddings_data]
#             user_vector = calculate_user_embedding(liked_vectors)

#             all_embeddings = (
#                 supabase
#                 .table("article_embeddings")
#                 .select("*")
#                 .execute()
#             ).data

#             recommendations = get_recommendations(user_vector, all_embeddings, top_k=10)

#             if recommendations:
#                 rec_ids = [r["article_id"] for r in recommendations]
#                 unsorted_articles = (
#                     supabase
#                     .table("articles")
#                     .select("*")
#                     .in_("id", rec_ids)
#                     .execute()
#                 ).data

#                 article_map = {a["id"]: a for a in unsorted_articles}
#                 return [article_map[rid] for rid in rec_ids if rid in article_map]

#         # Fallback → category-based recommendations
#         liked_articles = (
#             supabase
#             .table("articles")
#             .select("category")
#             .in_("id", article_ids)
#             .execute()
#         ).data

#         liked_categories = list(set([a["category"] for a in liked_articles]))

#         return (
#             supabase
#             .table("articles")
#             .select("*")
#             .in_("category", liked_categories)
#             .order("published_at", desc=True)
#             .limit(20)
#             .execute()
#         ).data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))






# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from supabase import create_client
# from pydantic import BaseModel
# import os
# from dotenv import load_dotenv

# load_dotenv()

# app = FastAPI()

# # -------------------- CORS --------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # -------------------- Supabase Setup --------------------
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# # -------------------- Models --------------------
# class InteractionRequest(BaseModel):
#     user_id: str
#     article_id: int
#     interaction_type: str


# # -------------------- Root --------------------
# @app.get("/")
# def root():
#     return {"message": "NovaNews API running"}


# # -------------------- Get All Articles --------------------
# @app.get("/articles")
# def get_articles(category: str = "All"):
#     try:
#         query = supabase.table("articles").select("*")

#         if category != "All":
#             query = query.eq("category", category.lower())

#         response = query.order("published_at", desc=True).execute()

#         return response.data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Get Single Article --------------------
# @app.get("/articles/{article_id}")
# def get_article(article_id: int):
#     try:
#         response = (
#             supabase
#             .table("articles")
#             .select("*")
#             .eq("id", article_id)
#             .single()
#             .execute()
#         )

#         return response.data

#     except Exception:
#         raise HTTPException(status_code=404, detail="Article not found")


# # -------------------- Log Interaction --------------------
# @app.post("/interact")
# def log_interaction(data: InteractionRequest):
#     try:
#         response = supabase.table("interactions").insert({
#             "user_id": data.user_id,
#             "article_id": data.article_id,
#             "interaction_type": data.interaction_type
#         }).execute()

#         return {"status": "success", "message": "Interaction logged"}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # -------------------- Recommend Articles --------------------
# @app.get("/recommend/{user_id}")
# def recommend(user_id: str):
#     try:
#         # Check if user has interactions
#         interactions = (
#             supabase
#             .table("interactions")
#             .select("article_id")
#             .eq("user_id", user_id)
#             .execute()
#         ).data

#         # If no history → return latest articles
#         if not interactions:
#             response = (
#                 supabase
#                 .table("articles")
#                 .select("*")
#                 .order("published_at", desc=True)
#                 .limit(20)
#                 .execute()
#             )
#             return response.data

#         # Get liked article IDs
#         liked_ids = [i["article_id"] for i in interactions]

#         # Fetch articles matching same categories as liked ones
#         liked_articles = (
#             supabase
#             .table("articles")
#             .select("category")
#             .in_("id", liked_ids)
#             .execute()
#         ).data

#         liked_categories = list(set([a["category"] for a in liked_articles]))

#         # Fetch articles from same categories
#         response = (
#             supabase
#             .table("articles")
#             .select("*")
#             .in_("category", liked_categories)
#             .order("published_at", desc=True)
#             .limit(20)
#             .execute()
#         )

#         return response.data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))







# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from supabase import create_client
# import os
# from dotenv import load_dotenv

# load_dotenv()

# app = FastAPI()

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Supabase setup
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# @app.get("/")
# def root():
#     return {"message": "NovaNews API running"}

# # Get all articles
# @app.get("/articles")
# def get_articles(category: str = "All"):
#     try:
#         query = supabase.table("articles").select("*")

#         if category != "All":
#             query = query.eq("category", category.lower())

#         response = query.order("published_at", desc=True).execute()

#         return response.data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # Get single article by ID
# @app.get("/articles/{article_id}")
# def get_article(article_id: int):
#     try:
#         response = (
#             supabase
#             .table("articles")
#             .select("*")
#             .eq("id", article_id)
#             .single()
#             .execute()
#         )

#         return response.data

#     except Exception:
#         raise HTTPException(status_code=404, detail="Article not found")

# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from typing import Optional
# from app.db import supabase
# from app.services.news_fetcher import fetch_and_store_news

# # --- AI / ML imports ---
# from app.services.vectorizer import process_new_articles
# from app.ml.recommender import get_recommendations, calculate_user_embedding

# app = FastAPI(title="NovaNews Backend")


# # ----------------------------
# # Pydantic Models
# # ----------------------------

# class InteractionRequest(BaseModel):
#     user_id: str
#     article_id: int
#     interaction_type: str


# # ----------------------------
# # Root
# # ----------------------------

# @app.get("/")
# def read_root():
#     return {"status": "active", "message": "NovaNews API is running"}


# # ----------------------------
# # Get All Articles (with optional category)
# # ----------------------------

# @app.get("/articles")
# def get_articles(category: Optional[str] = None):
#     try:
#         query = supabase.table("articles").select("*")

#         if category and category.lower() != "all":
#             query = query.eq("category", category.lower())

#         response = query.order("published_at", desc=True).execute()

#         return response.data

#     except Exception as e:
#         print("ERROR OCCURRED:", e)
#         raise HTTPException(status_code=500, detail=str(e))


# # ----------------------------
# # Get Single Article by ID
# # ----------------------------

# @app.get("/articles/{article_id}")
# def get_single_article(article_id: int):
#     try:
#         response = (
#             supabase
#             .table("articles")
#             .select("*")
#             .eq("id", article_id)
#             .single()
#             .execute()
#         )

#         if not response.data:
#             raise HTTPException(status_code=404, detail="Article not found")

#         return response.data

#     except Exception as e:
#         print("ERROR FETCHING SINGLE ARTICLE:", e)
#         raise HTTPException(status_code=500, detail=str(e))


# # ----------------------------
# # Log Interaction
# # ----------------------------

# @app.post("/interact")
# def log_interaction(data: InteractionRequest):
#     try:
#         interaction_entry = {
#             "user_id": data.user_id,
#             "article_id": data.article_id,
#             "interaction_type": data.interaction_type
#         }
   
#         response = supabase.table("interactions").insert(interaction_entry).execute()

#         return {"status": "success", "data": response.data}

#     except Exception as e:
#         return {"status": "error", "details": str(e)}


# # ----------------------------
# # Trigger News Fetch
# # ----------------------------

# @app.post("/update-news/{category}")
# def trigger_news_update(category: str):
#     return fetch_and_store_news(category)


# # ----------------------------
# # Trigger ML Vector Processing
# # ----------------------------

# @app.post("/trigger-ml")
# def trigger_ml_processing():
#     return process_new_articles()


# # ----------------------------
# # Get Recommendations
# # ----------------------------

# @app.get("/recommend/{user_id}")
# def recommend_articles(user_id: str):
#     try:
#         interactions = (
#             supabase
#             .table("interactions")
#             .select("article_id")
#             .eq("user_id", user_id)
#             .execute()
#             .data
#         )

#         if not interactions:
#             return (
#                 supabase
#                 .table("articles")
#                 .select("*")
#                 .order("published_at", desc=True)
#                 .limit(10)
#                 .execute()
#                 .data
#             )

#         article_ids = [i['article_id'] for i in interactions]

#         liked_embeddings_data = (
#             supabase
#             .table("article_embeddings")
#             .select("embedding")
#             .in_("article_id", article_ids)
#             .execute()
#             .data
#         )

#         liked_vectors = [x['embedding'] for x in liked_embeddings_data]

#         user_vector = calculate_user_embedding(liked_vectors)

#         all_embeddings = (
#             supabase
#             .table("article_embeddings")
#             .select("*")
#             .execute()
#             .data
#         )

#         recommendations = get_recommendations(user_vector, all_embeddings, top_k=5)

#         if not recommendations:
#             return []

#         rec_ids = [r['article_id'] for r in recommendations]

#         unsorted_articles = (
#             supabase
#             .table("articles")
#             .select("*")
#             .in_("id", rec_ids)
#             .execute()
#             .data
#         )

#         article_map = {a['id']: a for a in unsorted_articles}

#         final_articles = []
#         for rid in rec_ids:
#             if rid in article_map:
#                 final_articles.append(article_map[rid])

#         return final_articles

#     except Exception as e:
#         return {"error": str(e)}


# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from app.db import supabase
# from app.services.news_fetcher import fetch_and_store_news

# # --- AI / ML Imports ---
# from app.services.vectorizer import process_new_articles
# from app.ml.recommender import get_recommendations, calculate_user_embedding

# app = FastAPI(title="NovaNews Backend")

# # ------------------------
# # CORS CONFIG
# # ------------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ------------------------
# # Pydantic Models
# # ------------------------
# class InteractionRequest(BaseModel):
#     user_id: str
#     article_id: int
#     interaction_type: str


# # ------------------------
# # BASIC ROUTES
# # ------------------------

# @app.get("/")
# def read_root():
#     return {"status": "active", "message": "NovaNews API is running"}


# @app.get("/test-db")
# def test_db_connection():
#     try:
#         response = supabase.table("articles").select("*").limit(1).execute()
#         return {"status": "success", "data": response.data}
#     except Exception as e:
#         return {"error": str(e)}


# # ------------------------
# # DEBUG VERSION: FETCH ARTICLES
# # ------------------------

# @app.get("/articles")
# def get_articles(category: str = "All"):
#     try:
#         print("Fetching articles... Category:", category)

#         response = supabase.table("articles").select("*").execute()

#         print("Supabase raw response:", response)

#         return response.data

#     except Exception as e:
#         print("ERROR OCCURRED:", str(e))
#         return {"error": str(e)}


# # ------------------------
# # UPDATE NEWS
# # ------------------------

# @app.post("/update-news/{category}")
# def trigger_news_update(category: str):
#     return fetch_and_store_news(category)


# # ------------------------
# # INTERACTION ROUTE
# # ------------------------

# @app.post("/interact")
# def log_interaction(data: InteractionRequest):
#     try:
#         interaction_entry = {
#             "user_id": data.user_id,
#             "article_id": data.article_id,
#             "interaction_type": data.interaction_type
#         }

#         response = supabase.table("interactions").insert(interaction_entry).execute()

#         return {
#             "status": "success",
#             "message": "Interaction logged",
#             "data": response.data
#         }

#     except Exception as e:
#         print("INTERACTION ERROR:", str(e))
#         return {"error": str(e)}


# # ------------------------
# # ML ROUTES
# # ------------------------

# @app.post("/trigger-ml")
# def trigger_ml_processing():
#     return process_new_articles()


# @app.get("/recommend/{user_id}")
# def recommend_articles(user_id: str):
#     try:
#         interactions = supabase.table("interactions") \
#             .select("article_id") \
#             .eq("user_id", user_id) \
#             .execute().data

#         if not interactions:
#             return supabase.table("articles") \
#                 .select("*") \
#                 .limit(10) \
#                 .execute().data

#         article_ids = [i['article_id'] for i in interactions]

#         liked_embeddings_data = supabase.table("article_embeddings") \
#             .select("embedding") \
#             .in_("article_id", article_ids) \
#             .execute().data

#         liked_vectors = [x['embedding'] for x in liked_embeddings_data]

#         user_vector = calculate_user_embedding(liked_vectors)

#         all_embeddings = supabase.table("article_embeddings") \
#             .select("*") \
#             .execute().data

#         recommendations = get_recommendations(user_vector, all_embeddings, top_k=5)

#         if not recommendations:
#             return []

#         rec_ids = [r['article_id'] for r in recommendations]

#         unsorted_articles = supabase.table("articles") \
#             .select("*") \
#             .in_("id", rec_ids) \
#             .execute().data

#         article_map = {a['id']: a for a in unsorted_articles}

#         final_articles = []
#         for rid in rec_ids:
#             if rid in article_map:
#                 final_articles.append(article_map[rid])

#         return final_articles

#     except Exception as e:
#         print("RECOMMEND ERROR:", str(e))
#         return {"error": str(e)}


# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from app.db import supabase
# from app.services.news_fetcher import fetch_and_store_news

# # --- AI / ML Imports ---
# from app.services.vectorizer import process_new_articles
# from app.ml.recommender import get_recommendations, calculate_user_embedding

# app = FastAPI(title="NovaNews Backend")

# # ------------------------
# # CORS CONFIG (IMPORTANT)
# # ------------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ------------------------
# # Pydantic Models
# # ------------------------
# class InteractionRequest(BaseModel):
#     user_id: str
#     article_id: int
#     interaction_type: str  # 'like', 'view', 'skip'


# # ------------------------
# # BASIC ROUTES
# # ------------------------

# @app.get("/")
# def read_root():
#     return {"status": "active", "message": "NovaNews API is running"}


# @app.get("/test-db")
# def test_db_connection():
#     try:
#         response = supabase.table("articles").select("*").limit(1).execute()
#         return {"status": "success", "data": response.data}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ------------------------
# # NEW: FETCH ARTICLES
# # ------------------------

# @app.get("/articles")
# def get_articles(category: str = "All"):
#     """
#     Fetch articles from Supabase.
#     If category != 'All', filter by category.
#     """
#     try:
#         query = supabase.table("articles").select("*")

#         if category != "All":
#             query = query.eq("category", category)

#         response = query.order("published_at", desc=True).execute()

#         return response.data

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ------------------------
# # UPDATE NEWS (SCRAPER)
# # ------------------------

# @app.post("/update-news/{category}")
# def trigger_news_update(category: str):
#     result = fetch_and_store_news(category)
#     return result


# # ------------------------
# # INTERACTIONS
# # ------------------------

# @app.post("/interact")
# def log_interaction(data: InteractionRequest):
#     try:
#         interaction_entry = {
#             "user_id": data.user_id,
#             "article_id": data.article_id,
#             "interaction_type": data.interaction_type
#         }

#         response = supabase.table("interactions").insert(interaction_entry).execute()

#         return {
#             "status": "success",
#             "message": "Interaction logged",
#             "data": response.data
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # ------------------------
# # AI / ML ROUTES
# # ------------------------

# @app.post("/trigger-ml")
# def trigger_ml_processing():
#     return process_new_articles()


# @app.get("/recommend/{user_id}")
# def recommend_articles(user_id: str):
#     try:
#         interactions = supabase.table("interactions") \
#             .select("article_id") \
#             .eq("user_id", user_id) \
#             .execute().data

#         # Cold Start
#         if not interactions:
#             return supabase.table("articles") \
#                 .select("*") \
#                 .order("published_at", desc=True) \
#                 .limit(10) \
#                 .execute().data

#         article_ids = [i['article_id'] for i in interactions]

#         liked_embeddings_data = supabase.table("article_embeddings") \
#             .select("embedding") \
#             .in_("article_id", article_ids) \
#             .execute().data

#         liked_vectors = [x['embedding'] for x in liked_embeddings_data]

#         user_vector = calculate_user_embedding(liked_vectors)

#         all_embeddings = supabase.table("article_embeddings") \
#             .select("*") \
#             .execute().data

#         recommendations = get_recommendations(user_vector, all_embeddings, top_k=5)

#         if not recommendations:
#             return []

#         rec_ids = [r['article_id'] for r in recommendations]

#         unsorted_articles = supabase.table("articles") \
#             .select("*") \
#             .in_("id", rec_ids) \
#             .execute().data

#         article_map = {a['id']: a for a in unsorted_articles}

#         final_articles = []
#         for rid in rec_ids:
#             if rid in article_map:
#                 final_articles.append(article_map[rid])

#         return final_articles

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# # Run with: uvicorn app.main:app --reload

# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from app.db import supabase
# from app.services.news_fetcher import fetch_and_store_news

# # --- NEW: Imports for AI/ML ---
# from app.services.vectorizer import process_new_articles
# from app.ml.recommender import get_recommendations, calculate_user_embedding

# app = FastAPI(title="NovaNews Backend")

# # --- Pydantic Models ---
# class InteractionRequest(BaseModel):
#     user_id: str
#     article_id: int
#     interaction_type: str  # e.g., 'like', 'view', 'skip'

# # --- Existing Routes ---

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
#     # This calls the news fetcher service
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

# # --- NEW: AI / ML Routes ---

# @app.post("/trigger-ml")
# def trigger_ml_processing():
#     """
#     Manually triggers the AI to find new articles and convert them to vectors.
#     """
#     return process_new_articles()

# @app.get("/recommend/{user_id}")
# def recommend_articles(user_id: str):
#     """
#     Returns personalized news articles based on the user's interaction history.
#     """
#     try:
#         # 1. Get User's History (Interactions)
#         interactions = supabase.table("interactions").select("article_id").eq("user_id", user_id).execute().data
        
#         # COLD START CHECK: If user has no history, return latest news
#         if not interactions:
#             print("Cold Start: User has no history. Returning latest news.")
#             return supabase.table("articles").select("*").order("published_at", desc=True).limit(10).execute().data

#         # 2. Get the embeddings of the articles they liked/viewed
#         article_ids = [i['article_id'] for i in interactions]
        
#         # Fetch the vectors for these articles
#         liked_embeddings_data = supabase.table("article_embeddings").select("embedding").in_("article_id", article_ids).execute().data
        
#         # Extract just the lists of numbers
#         liked_vectors = [x['embedding'] for x in liked_embeddings_data]

#         # 3. Build User Profile (Average Vector)
#         user_vector = calculate_user_embedding(liked_vectors)

#         # 4. Fetch ALL article embeddings to compare against
#         all_embeddings = supabase.table("article_embeddings").select("*").execute().data
        
#         # 5. Get Recommendations (Math Magic)
#         recommendations = get_recommendations(user_vector, all_embeddings, top_k=5)

#         # 6. Fetch full details for the recommended articles
#         if not recommendations:
#             return []
            
#         rec_ids = [r['article_id'] for r in recommendations]
        
#         # Fetch unsorted data from DB
#         unsorted_articles = supabase.table("articles").select("*").in_("id", rec_ids).execute().data
        
#         # --- FIX STARTS HERE ---
#         # Create a dictionary for fast lookup: { article_id: article_data }
#         article_map = {a['id']: a for a in unsorted_articles}
        
#         # Re-build the list in the CORRECT order (matching rec_ids)
#         final_articles = []
#         for rid in rec_ids:
#             if rid in article_map:
#                 final_articles.append(article_map[rid])
#         # --- FIX ENDS HERE ---
        
#         return final_articles

#     except Exception as e:
#         return {"error": str(e)}