import os
import requests
import json

api_key = os.getenv('VITE_GROQ_API_KEY')
if not api_key:
    # Try reading from .env file if env var not set
    try:
        with open('.env', 'r') as f:
            for line in f:
                if 'VITE_GROQ_API_KEY=' in line:
                    api_key = line.split('=')[1].strip().strip('"').strip("'")
                    break
    except:
        pass

if not api_key:
    print("Error: VITE_GROQ_API_KEY not found.")
    exit(1)

headers = {
    "Authorization": f"Bearer {api_key}"
}

try:
    response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
    models = response.json()
    print(json.dumps(models, indent=2))
except Exception as e:
    print(f"Error: {e}")
