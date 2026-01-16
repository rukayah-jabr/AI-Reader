"""
Audio Routes
Endpoints für die Audioverarbeitung und Transkript-Generierung
"""

from flask import Blueprint, request, jsonify, current_app
import base64
import os

audio_bp = Blueprint('audio', __name__)


def allowed_audio(filename):
    """Überprüft ob die Dateiendung erlaubt ist"""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in current_app.config.get('ALLOWED_AUDIO_EXTENSIONS', {'mp3', 'wav', 'ogg', 'flac', 'm4a', 'webm'})


@audio_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Erstellt ein Transkript für eine hochgeladene Audiodatei
    
    Request: multipart/form-data mit 'audio' file
    Optional: 'language' (de/en)
    
    Response: { success: true, transcript: "...", duration: 120.5 }
    """
    # Check if audio file is present
    if 'audio' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No audio provided',
            'message': 'Bitte laden Sie eine Audiodatei hoch.'
        }), 400
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected',
            'message': 'Keine Datei ausgewählt.'
        }), 400
    
    if not allowed_audio(file.filename):
        return jsonify({
            'success': False,
            'error': 'Invalid file type',
            'message': 'Ungültiger Dateityp. Erlaubt: MP3, WAV, OGG, FLAC, M4A, WebM'
        }), 400
    
    try:
        # Read audio data
        audio_data = file.read()
        
        # Get optional parameters
        language = request.form.get('language', 'de')
        
        # Get file extension for mime type
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        
        # Import and use AI service
        from services.audio_service import AudioService
        service = AudioService()
        
        result = service.transcribe_audio(
            audio_data=audio_data,
            file_extension=file_ext,
            language=language
        )
        
        return jsonify({
            'success': True,
            'transcript': result['transcript'],
            'duration': result.get('duration'),
            'language': result.get('detected_language', language),
            'confidence': result.get('confidence', 0.9)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Processing error',
            'message': f'Fehler bei der Audioverarbeitung: {str(e)}'
        }), 500


@audio_bp.route('/transcribe-url', methods=['POST'])
def transcribe_audio_url():
    """
    Erstellt ein Transkript für Audio anhand der URL
    
    Request: JSON { "url": "https://...", "language": "de" }
    
    Response: { success: true, transcript: "...", duration: 120.5 }
    """
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({
            'success': False,
            'error': 'No URL provided',
            'message': 'Bitte geben Sie eine Audio-URL an.'
        }), 400
    
    url = data['url']
    language = data.get('language', 'de')
    
    try:
        from services.audio_service import AudioService
        service = AudioService()
        
        result = service.transcribe_audio_from_url(
            audio_url=url,
            language=language
        )
        
        return jsonify({
            'success': True,
            'transcript': result['transcript'],
            'duration': result.get('duration'),
            'language': result.get('detected_language', language),
            'confidence': result.get('confidence', 0.9),
            'source_url': url
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Processing error',
            'message': f'Fehler bei der Audioverarbeitung: {str(e)}'
        }), 500


@audio_bp.route('/summary', methods=['POST'])
def audio_summary():
    """
    Erstellt eine Zusammenfassung eines Transkripts
    Nützlich für lange Audiodateien
    
    Request: JSON { "transcript": "...", "max_length": 500 }
    
    Response: { success: true, summary: "..." }
    """
    data = request.get_json()
    
    if not data or 'transcript' not in data:
        return jsonify({
            'success': False,
            'error': 'No transcript provided',
            'message': 'Bitte geben Sie ein Transkript an.'
        }), 400
    
    transcript = data['transcript']
    max_length = data.get('max_length', 500)
    language = data.get('language', 'de')
    
    try:
        from services.audio_service import AudioService
        service = AudioService()
        
        result = service.summarize_transcript(
            transcript=transcript,
            max_length=max_length,
            language=language
        )
        
        return jsonify({
            'success': True,
            'summary': result['summary'],
            'original_length': len(transcript),
            'summary_length': len(result['summary'])
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Processing error',
            'message': f'Fehler bei der Zusammenfassung: {str(e)}'
        }), 500
