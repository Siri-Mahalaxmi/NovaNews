import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def calculate_user_embedding(liked_embeddings: list):
    """
    Creates a 'User Profile' vector by averaging the embeddings of articles they liked.
    """
    if not liked_embeddings:
        return None
    
    # Convert list of lists to a 2D Matrix
    matrix = np.array(liked_embeddings)
    
    # Calculate the mean (average) across the rows (axis=0)
    user_vector = np.mean(matrix, axis=0)
    return user_vector.tolist()

def get_recommendations(user_vector, all_articles_data, top_k=5):
    """
    Compares the User Vector against All Article Vectors to find matches.
    """
    if not user_vector or not all_articles_data:
        return []

    # 1. Prepare data for Scikit-Learn
    # Extract just the IDs and the Embeddings
    article_ids = [item['article_id'] for item in all_articles_data]
    article_vectors = [item['embedding'] for item in all_articles_data]
    
    # 2. Reshape user vector to be (1, 384)
    user_vector_reshaped = np.array(user_vector).reshape(1, -1)
    
    # 3. Calculate Cosine Similarity
    # Returns a list of scores between 0 (not similar) and 1 (identical)
    scores = cosine_similarity(user_vector_reshaped, article_vectors)[0]
    
    # 4. Sort and pick top K
    # argsort returns indices of sorted items, we take the last K (highest scores) and reverse them
    top_indices = scores.argsort()[-top_k:][::-1]
    
    recommendations = []
    for idx in top_indices:
        recommendations.append({
            "article_id": article_ids[idx],
            "score": float(scores[idx])  # Convert numpy float to standard python float
        })
        
    return recommendations