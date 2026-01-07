from app.db import supabase
from app.ml.model import generate_embedding

def process_new_articles():
    """
    Fetches articles that don't have embeddings yet and processes them.
    """
    print("ML Service: Checking for new articles...")

    # 1. Fetch all articles (ID, Title, Description)
    # Note: In a huge app, you'd filter this query. For a mini-project, fetching all is fine.
    articles_response = supabase.table("articles").select("id, title, description").execute()
    articles = articles_response.data

    # 2. Fetch existing embedding IDs to avoid re-doing work
    embeddings_response = supabase.table("article_embeddings").select("article_id").execute()
    existing_ids = {row['article_id'] for row in embeddings_response.data}

    # 3. Identify which ones are new
    new_articles = [a for a in articles if a['id'] not in existing_ids]

    if not new_articles:
        print("No new articles to process.")
        return {"message": "All articles already embedded."}

    print(f"⚡ Vectorizing {len(new_articles)} new articles...")
    processed_count = 0

    # 4. Loop, Generate, Save
    for art in new_articles:
        try:
            # Combine title + desc for a rich context
            text = f"{art['title']} {art.get('description') or ''}"
            
            # Generate Vector
            vector = generate_embedding(text)

            # Insert into DB
            data = {
                "article_id": art['id'],
                "embedding": vector,
                "model_name": "all-MiniLM-L6-v2"
            }
            supabase.table("article_embeddings").insert(data).execute()
            processed_count += 1
        except Exception as e:
            print(f"Error processing article {art['id']}: {e}")

    return {"message": "Success", "processed": processed_count}