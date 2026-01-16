"""
Health Check Routes
Endpoints für Systemstatus und API-Verfügbarkeit
"""

from flask import Blueprint, jsonify
from config import get_config

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health Check Endpoint
    Überprüft ob der Server läuft und die APIs konfiguriert sind
    """
    config = get_config()
    
    # Check API key availability
    openai_configured = bool(config.OPENAI_API_KEY)
    google_configured = bool(config.GOOGLE_AI_API_KEY)
    
    return jsonify({
        'success': True,
        'status': 'healthy',
        'message': 'AI-Reader Backend ist aktiv',
        'services': {
            'image_description': {
                'available': openai_configured or google_configured,
                'provider': 'openai' if openai_configured else ('google' if google_configured else 'none')
            },
            'audio_transcription': {
                'available': openai_configured,
                'provider': 'openai' if openai_configured else 'none'
            }
        },
        'version': '1.0.0'
    })


@health_bp.route('/', methods=['GET'])
def api_info():
    """
    API Information Endpoint
    Gibt Informationen über verfügbare Endpoints zurück
    """
    return jsonify({
        'success': True,
        'name': 'AI-Reader API',
        'description': 'KI-gestütztes Tool für automatische Accessibility',
        'version': '1.0.0',
        'endpoints': {
            'health': {
                'GET /api/health': 'Systemstatus überprüfen'
            },
            'image': {
                'POST /api/image/describe': 'Alt-Text für Bild generieren',
                'POST /api/image/describe-url': 'Alt-Text für Bild-URL generieren',
                'POST /api/image/batch': 'Mehrere Bilder verarbeiten'
            },
            'audio': {
                'POST /api/audio/transcribe': 'Audio-Transkript erstellen',
                'POST /api/audio/transcribe-url': 'Audio von URL transkribieren'
            }
        }
    })
