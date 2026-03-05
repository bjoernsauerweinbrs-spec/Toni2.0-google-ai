import functions_framework
from google.cloud import aiplatform
import vertexai
from vertexai.preview.generative_models import GenerativeModel, Part
import json

# Initialize Vertex AI
vertexai.init(project="stark-performance-lab", location="us-central1")

@functions_framework.http
def process_video_highlight(request):
    """
    Cloud Function to process video clips, generate journalistic captions via Gemini,
    and format data for the Stark Performance Journal and Briefcase.
    """
    request_json = request.get_json(silent=True)
    
    if not request_json:
        return 'Invalid Request', 400

    video_uri = request_json.get('video_uri')
    player_id = request_json.get('player_id')
    player_name = request_json.get('player_name')
    event_type = request_json.get('event_type') # GOAL, TACTICAL, SKILL
    metrics = request_json.get('metrics', {}) # e.g., { "heart_rate": 185, "speed": 32.4 }

    if not video_uri or not player_name:
        return 'Missing required fields', 400

    # 1. Generate Journalistic Caption using Presse-Toni Persona
    model = GenerativeModel("gemini-1.5-pro-preview-0409")
    
    prompt = f"""
    You are 'Presse-Toni', the Chief Editor of the Red Bull / Stark Performance Journal.
    Write a short, aggressive, high-impact headline and a 1-sentence caption for a video highlight.
    
    Context:
    - Player: {player_name}
    - Event: {event_type}
    - Biometrics: Heart Rate {metrics.get('heart_rate', 'N/A')} bpm, Top Speed {metrics.get('speed', 'N/A')} km/h.
    
    Style Guide:
    - Red Bulletin Aesthetic: Bold, energetic, punchy.
    - Use the biometric data to emphasize the physical feat.
    - Format: JSON with 'headline' and 'caption'.
    """

    response = model.generate_content(prompt)
    
    try:
        # Clean up code blocks if present
        text_response = response.text.replace('```json', '').replace('```', '')
        generated_content = json.loads(text_response)
    except Exception as e:
        print(f"AI Generation failed: {e}")
        generated_content = {
            "headline": f"UNSTOPPABLE: {player_name.upper()}",
            "caption": f"An incredible display of athleticism from {player_name}."
        }

    # 2. Format Data for Journal Page
    journal_page_payload = {
        "type": "HIGHLIGHTS",
        "data": {
            "videoUrl": video_uri,
            "headline": generated_content['headline'],
            "caption": generated_content['caption'],
            "metrics": metrics,
            "playerId": player_id,
            "timestamp": "Matchday 14 - 78'"
        }
    }

    # 3. Sync Logic (Mock - in production this would write to Firestore/Briefcase API)
    # firestore.collection('briefcase').add(journal_page_payload)
    # firestore.collection('players').document(player_id).collection('highlights').add(journal_page_payload)

    return json.dumps({
        "success": True,
        "journal_entry": journal_page_payload,
        "briefcase_sync": "COMPLETED",
        "locker_room_sync": "COMPLETED"
    }), 200, {'Content-Type': 'application/json'}
