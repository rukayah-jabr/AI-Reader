"""
Audio Service
KI-gestützte Audiotranskription und Verarbeitung
"""

import base64
import requests
import tempfile
import os
import sys

# Add parent directory to path for config import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_config


class AudioService:
    """
    Service für die Transkription von Audiodateien mittels KI
    Verwendet OpenAI Whisper für Speech-to-Text
    """
    
    def __init__(self):
        self.config = get_config()
        self.openai_api_key = self.config.OPENAI_API_KEY
        
    def transcribe_audio(
        self,
        audio_data: bytes,
        file_extension: str = 'mp3',
        language: str = 'de'
    ) -> dict:
        """
        Transkribiert eine Audiodatei zu Text
        
        Args:
            audio_data: Binäre Audiodaten
            file_extension: Dateiendung (mp3, wav, etc.)
            language: Erwartete Sprache der Audio
            
        Returns:
            dict mit 'transcript', 'duration', 'detected_language'
        """
        
        if not self.openai_api_key:
            raise ValueError("Kein OpenAI API-Key konfiguriert. Bitte OPENAI_API_KEY setzen.")
        
        return self._transcribe_with_openai(audio_data, file_extension, language)
    
    def transcribe_audio_from_url(
        self,
        audio_url: str,
        language: str = 'de'
    ) -> dict:
        """
        Transkribiert Audio von einer URL
        
        Args:
            audio_url: URL der Audiodatei
            language: Erwartete Sprache
            
        Returns:
            dict mit 'transcript', 'duration', 'detected_language'
        """
        
        # Download audio file
        response = requests.get(audio_url, timeout=60)
        response.raise_for_status()
        
        # Determine file extension from URL or content type
        file_extension = 'mp3'  # Default
        if '.' in audio_url:
            ext = audio_url.rsplit('.', 1)[-1].lower()
            if ext in ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'webm']:
                file_extension = ext
        
        return self.transcribe_audio(response.content, file_extension, language)
    
    def _transcribe_with_openai(
        self,
        audio_data: bytes,
        file_extension: str,
        language: str
    ) -> dict:
        """Transkribiert Audio mit OpenAI Whisper"""
        
        from openai import OpenAI
        
        client = OpenAI(api_key=self.openai_api_key)
        
        # Create temporary file for the audio
        with tempfile.NamedTemporaryFile(
            suffix=f'.{file_extension}',
            delete=False
        ) as temp_file:
            temp_file.write(audio_data)
            temp_path = temp_file.name
        
        try:
            # Open and transcribe the audio file
            with open(temp_path, 'rb') as audio_file:
                # Use Whisper API
                transcript_response = client.audio.transcriptions.create(
                    model=self.config.AUDIO_MODEL,
                    file=audio_file,
                    language=language if language != 'auto' else None,
                    response_format="verbose_json"
                )
            
            # Extract transcript and metadata
            transcript = transcript_response.text
            duration = getattr(transcript_response, 'duration', None)
            detected_language = getattr(transcript_response, 'language', language)
            
            return {
                'transcript': transcript,
                'duration': duration,
                'detected_language': detected_language,
                'confidence': 0.95,
                'provider': 'openai-whisper'
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def summarize_transcript(
        self,
        transcript: str,
        max_length: int = 500,
        language: str = 'de'
    ) -> dict:
        """
        Erstellt eine Zusammenfassung eines Transkripts
        
        Args:
            transcript: Das zu zusammenfassende Transkript
            max_length: Maximale Länge der Zusammenfassung
            language: Sprache der Zusammenfassung
            
        Returns:
            dict mit 'summary'
        """
        
        if not self.openai_api_key:
            raise ValueError("Kein OpenAI API-Key konfiguriert.")
        
        from openai import OpenAI
        
        client = OpenAI(api_key=self.openai_api_key)
        
        system_prompts = {
            'de': f'''Du bist ein Experte für barrierefreie Zusammenfassungen.
Erstelle eine präzise Zusammenfassung des folgenden Transkripts.
Die Zusammenfassung soll maximal {max_length} Zeichen lang sein.
Fokussiere auf die wichtigsten Informationen.
Antworte nur mit der Zusammenfassung, ohne Einleitung.''',
            
            'en': f'''You are an expert in accessible summaries.
Create a precise summary of the following transcript.
The summary should be a maximum of {max_length} characters.
Focus on the most important information.
Reply only with the summary, without introduction.'''
        }
        
        system_prompt = system_prompts.get(language, system_prompts['en'])
        
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript}
            ],
            max_tokens=500
        )
        
        summary = response.choices[0].message.content.strip()
        
        # Ensure max length
        if len(summary) > max_length:
            summary = summary[:max_length-3] + "..."
        
        return {
            'summary': summary,
            'provider': 'openai'
        }
    
    def generate_audio_description(
        self,
        transcript: str,
        language: str = 'de'
    ) -> dict:
        """
        Generiert eine kurze Beschreibung des Audio-Inhalts
        Nützlich für aria-label oder title-Attribute
        
        Args:
            transcript: Das Transkript
            language: Sprache der Beschreibung
            
        Returns:
            dict mit 'description'
        """
        
        if not self.openai_api_key:
            raise ValueError("Kein OpenAI API-Key konfiguriert.")
        
        from openai import OpenAI
        
        client = OpenAI(api_key=self.openai_api_key)
        
        system_prompts = {
            'de': '''Erstelle eine kurze, beschreibende Zusammenfassung (max. 100 Zeichen) 
für diesen Audio-Inhalt. Die Beschreibung soll für ein aria-label geeignet sein.
Format: "Audio: [Inhaltsbeschreibung]"
Beispiel: "Audio: Interview über Klimawandel mit Prof. Dr. Müller"''',
            
            'en': '''Create a short descriptive summary (max. 100 characters) 
for this audio content. The description should be suitable for an aria-label.
Format: "Audio: [content description]"
Example: "Audio: Interview about climate change with Prof. Dr. Smith"'''
        }
        
        system_prompt = system_prompts.get(language, system_prompts['en'])
        
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript[:2000]}  # Limit input
            ],
            max_tokens=100
        )
        
        description = response.choices[0].message.content.strip()
        
        return {
            'description': description,
            'provider': 'openai'
        }
