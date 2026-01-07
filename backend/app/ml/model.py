from sentence_transformers import SentenceTransformer

# Global variable to hold the model in memory
_model = None

def get_model():
    """
    Singleton pattern: Loads the model only if it hasn't been loaded yet.
    """
    global _model
    if _model is None:
        print("Loading AI Model (all-MiniLM-L6-v2)...")
        # 'all-MiniLM-L6-v2' is a small, fast model perfect for local development
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        print("AI Model loaded successfully.")
    return _model

def generate_embedding(text: str):
    """
    Converts text (Title + Description) into a list of 384 numbers.
    """
    model = get_model()
    # .encode() returns a numpy array, convert to list for JSON/Supabase
    return model.encode(text).tolist()