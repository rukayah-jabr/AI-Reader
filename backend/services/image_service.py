"""
Image Service
KI-gestützte Bildanalyse und Alt-Text-Generierung
"""

import base64
import requests
from typing import Optional
import os
import sys

# Add parent directory to path for config import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_config


class ImageService:
    """
    Service für die Generierung von Alt-Texten mittels KI
    Unterstützt OpenAI GPT-4 Vision und Google Gemini
    """
    
    def __init__(self):
        self.config = get_config()
        self.openai_api_key = self.config.OPENAI_API_KEY
        self.google_api_key = self.config.GOOGLE_AI_API_KEY
        
    def _get_system_prompt(self, language: str, context: str = '') -> str:
        """Erstellt den System-Prompt für die Alt-Text-Generierung"""
        
        lang_instructions = {
            'de': '''Du bist ein Experte für Web-Accessibility und hilfst dabei, 
barrierefreie Alt-Texte für Bilder zu erstellen. 

Deine Aufgabe:
- Beschreibe das Bild präzise und informativ
- Der Alt-Text soll für Screenreader-Nutzer verständlich sein
- Fokussiere auf die wichtigsten visuellen Informationen
- Halte den Text zwischen 50-200 Zeichen
- Vermeide "Bild von..." oder "Foto zeigt..."
- Beschreibe Farben, Personen, Objekte und Aktionen
- Sei objektiv und neutral

Antworte NUR mit dem Alt-Text, ohne zusätzliche Erklärungen.''',
            
            'en': '''You are an expert in web accessibility helping to create 
accessible alt texts for images.

Your task:
- Describe the image precisely and informatively
- The alt text should be understandable for screen reader users
- Focus on the most important visual information
- Keep the text between 50-200 characters
- Avoid "Image of..." or "Photo shows..."
- Describe colors, people, objects, and actions
- Be objective and neutral

Reply ONLY with the alt text, without additional explanations.'''
        }
        
        base_prompt = lang_instructions.get(language, lang_instructions['en'])
        
        if context:
            context_addition = f"\n\nKontext des Bildes: {context}" if language == 'de' else f"\n\nImage context: {context}"
            base_prompt += context_addition
            
        return base_prompt
    
    def generate_alt_text(
        self, 
        image_base64: str, 
        mime_type: str = 'image/jpeg',
        language: str = 'de',
        context: str = ''
    ) -> dict:
        """
        Generiert Alt-Text für ein Base64-kodiertes Bild
        
        Args:
            image_base64: Base64-kodierte Bilddaten
            mime_type: MIME-Typ des Bildes
            language: Sprache für den Alt-Text ('de' oder 'en')
            context: Optionaler Kontext zum Bild
            
        Returns:
            dict mit 'alt_text' und 'confidence'
        """
        
        # Try OpenAI first, then Google
        if self.openai_api_key:
            return self._generate_with_openai(image_base64, mime_type, language, context)
        elif self.google_api_key:
            return self._generate_with_google(image_base64, mime_type, language, context)
        else:
            raise ValueError("Kein API-Key konfiguriert. Bitte OPENAI_API_KEY oder GOOGLE_AI_API_KEY setzen.")
    
    def generate_alt_text_from_url(
        self,
        image_url: str,
        language: str = 'de',
        context: str = ''
    ) -> dict:
        """
        Generiert Alt-Text für ein Bild anhand der URL
        
        Args:
            image_url: URL des Bildes
            language: Sprache für den Alt-Text
            context: Optionaler Kontext
            
        Returns:
            dict mit 'alt_text' und 'confidence'
        """
        
        if self.openai_api_key:
            return self._generate_with_openai_url(image_url, language, context)
        elif self.google_api_key:
            # Download image and convert to base64 for Google
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            image_base64 = base64.b64encode(response.content).decode('utf-8')
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            return self._generate_with_google(image_base64, content_type, language, context)
        else:
            raise ValueError("Kein API-Key konfiguriert.")
    
    def _generate_with_openai(
        self,
        image_base64: str,
        mime_type: str,
        language: str,
        context: str
    ) -> dict:
        """Generiert Alt-Text mit OpenAI GPT-4 Vision"""
        
        from openai import OpenAI
        
        client = OpenAI(api_key=self.openai_api_key)
        
        system_prompt = self._get_system_prompt(language, context)
        
        response = client.chat.completions.create(
            model=self.config.IMAGE_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_base64}",
                                "detail": "auto"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Erstelle einen Alt-Text für dieses Bild." if language == 'de' else "Create an alt text for this image."
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        
        alt_text = response.choices[0].message.content.strip()
        
        # Truncate if too long
        max_length = self.config.ALT_TEXT_MAX_LENGTH
        if len(alt_text) > max_length:
            alt_text = alt_text[:max_length-3] + "..."
        
        return {
            'alt_text': alt_text,
            'confidence': 0.95,
            'provider': 'openai'
        }
    
    def _generate_with_openai_url(
        self,
        image_url: str,
        language: str,
        context: str
    ) -> dict:
        """Generiert Alt-Text mit OpenAI GPT-4 Vision direkt von URL"""
        
        from openai import OpenAI
        
        client = OpenAI(api_key=self.openai_api_key)
        
        system_prompt = self._get_system_prompt(language, context)
        
        response = client.chat.completions.create(
            model=self.config.IMAGE_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url,
                                "detail": "auto"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Erstelle einen Alt-Text für dieses Bild." if language == 'de' else "Create an alt text for this image."
                        }
                    ]
                }
            ],
            max_tokens=300
        )
        
        alt_text = response.choices[0].message.content.strip()
        
        # Truncate if too long
        max_length = self.config.ALT_TEXT_MAX_LENGTH
        if len(alt_text) > max_length:
            alt_text = alt_text[:max_length-3] + "..."
        
        return {
            'alt_text': alt_text,
            'confidence': 0.95,
            'provider': 'openai'
        }
    
    def _generate_with_google(
        self,
        image_base64: str,
        mime_type: str,
        language: str,
        context: str
    ) -> dict:
        """Generiert Alt-Text mit Google Gemini Vision"""
        
        import google.generativeai as genai
        
        genai.configure(api_key=self.google_api_key)
        model = genai.GenerativeModel('gemini-pro-vision')
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(image_base64)
        
        system_prompt = self._get_system_prompt(language, context)
        
        response = model.generate_content([
            system_prompt,
            {"mime_type": mime_type, "data": image_bytes},
            "Erstelle einen Alt-Text für dieses Bild." if language == 'de' else "Create an alt text for this image."
        ])
        
        alt_text = response.text.strip()
        
        # Truncate if too long
        max_length = self.config.ALT_TEXT_MAX_LENGTH
        if len(alt_text) > max_length:
            alt_text = alt_text[:max_length-3] + "..."
        
        return {
            'alt_text': alt_text,
            'confidence': 0.90,
            'provider': 'google'
        }
