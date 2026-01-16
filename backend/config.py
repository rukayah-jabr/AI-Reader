"""
AI-Reader Backend Configuration
Zentrale Konfigurationsverwaltung für das Flask Backend
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file in parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)


class Config:
    """Base configuration class"""
    
    # Flask Settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 'yes')
    
    # Server Settings
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # CORS Settings
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    
    # API Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    GOOGLE_AI_API_KEY = os.getenv('GOOGLE_AI_API_KEY')
    
    # File Upload Settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max file size
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'}
    ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac', 'm4a', 'webm'}
    
    # AI Model Settings
    IMAGE_MODEL = os.getenv('IMAGE_MODEL', 'gpt-4o-mini')  # or 'gemini-pro-vision'
    AUDIO_MODEL = os.getenv('AUDIO_MODEL', 'whisper-1')
    
    # Accessibility Settings
    DEFAULT_LANGUAGE = os.getenv('DEFAULT_LANGUAGE', 'de')  # German as default
    ALT_TEXT_MAX_LENGTH = int(os.getenv('ALT_TEXT_MAX_LENGTH', 250))


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])
