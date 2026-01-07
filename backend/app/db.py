import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Build the path to the .env file
# This tells Python: "Start at this file (db.py), go up one folder (to app), then up one more (to backend), and look for .env"
env_path = Path(__file__).resolve().parent.parent / ".env"

# 2. Load the .env file
print(f"Looking for .env at: {env_path}") # Debug print
load_dotenv(dotenv_path=env_path)

# 3. Get the keys
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# 4. Check if they exist
if not url:
    print("Error: SUPABASE_URL is missing from environment.")
if not key:
    print("Error: SUPABASE_KEY is missing from environment.")

if not url or not key:
    raise ValueError("Supabase credentials not found. Please check your .env file content.")

# 5. Connect
supabase: Client = create_client(url, key)
print("Supabase client initialized.")