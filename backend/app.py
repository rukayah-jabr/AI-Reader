"""
AI-Reader Flask Backend
Hauptanwendung für die REST API
"""

from flask import Flask, jsonify
from flask_cors import CORS
from config import get_config


def create_app(config_class=None):
    """Application Factory Pattern"""
    app = Flask(__name__)
    
    # Load configuration
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)
    
    # Initialize CORS
    CORS(app, origins=app.config.get('ALLOWED_ORIGINS', '*'))
    
    # Register blueprints
    from routes.image_routes import image_bp
    from routes.audio_routes import audio_bp
    from routes.health_routes import health_bp
    
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(image_bp, url_prefix='/api/image')
    app.register_blueprint(audio_bp, url_prefix='/api/audio')
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'error': 'Bad Request',
            'message': str(error.description)
        }), 400
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': 'Die angeforderte Ressource wurde nicht gefunden.'
        }), 404
    
    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({
            'success': False,
            'error': 'File Too Large',
            'message': 'Die Datei ist zu groß. Maximale Größe: 16 MB.'
        }), 413
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'Ein interner Serverfehler ist aufgetreten.'
        }), 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    config = get_config()
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    )
