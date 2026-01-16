"""
Image Routes
Endpoints für die Bildverarbeitung und Alt-Text-Generierung
"""

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import base64
import os

image_bp = Blueprint('image', __name__)


def allowed_image(filename):
    """Überprüft ob die Dateiendung erlaubt ist"""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'webp'})


@image_bp.route('/describe', methods=['POST'])
def describe_image():
    """
    Generiert Alt-Text für ein hochgeladenes Bild
    
    Request: multipart/form-data mit 'image' file
    Optional: 'language' (de/en), 'context' (zusätzlicher Kontext)
    
    Response: { success: true, alt_text: "...", confidence: 0.95 }
    """
    # Check if image file is present
    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image provided',
            'message': 'Bitte laden Sie ein Bild hoch.'
        }), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected',
            'message': 'Keine Datei ausgewählt.'
        }), 400
    
    if not allowed_image(file.filename):
        return jsonify({
            'success': False,
            'error': 'Invalid file type',
            'message': 'Ungültiger Dateityp. Erlaubt: PNG, JPG, JPEG, GIF, WebP'
        }), 400
    
    try:
        # Read image data
        image_data = file.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Get optional parameters
        language = request.form.get('language', 'de')
        context = request.form.get('context', '')
        
        # Get file mime type
        mime_type = file.content_type or 'image/jpeg'
        
        # Import and use AI service
        from services.image_service import ImageService
        service = ImageService()
        
        result = service.generate_alt_text(
            image_base64=image_base64,
            mime_type=mime_type,
            language=language,
            context=context
        )
        
        return jsonify({
            'success': True,
            'alt_text': result['alt_text'],
            'confidence': result.get('confidence', 0.9),
            'language': language
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Processing error',
            'message': f'Fehler bei der Bildverarbeitung: {str(e)}'
        }), 500


@image_bp.route('/describe-url', methods=['POST'])
def describe_image_url():
    """
    Generiert Alt-Text für ein Bild anhand der URL
    
    Request: JSON { "url": "https://...", "language": "de", "context": "" }
    
    Response: { success: true, alt_text: "...", confidence: 0.95 }
    """
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({
            'success': False,
            'error': 'No URL provided',
            'message': 'Bitte geben Sie eine Bild-URL an.'
        }), 400
    
    url = data['url']
    language = data.get('language', 'de')
    context = data.get('context', '')
    
    try:
        from services.image_service import ImageService
        service = ImageService()
        
        result = service.generate_alt_text_from_url(
            image_url=url,
            language=language,
            context=context
        )
        
        return jsonify({
            'success': True,
            'alt_text': result['alt_text'],
            'confidence': result.get('confidence', 0.9),
            'language': language,
            'source_url': url
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Processing error',
            'message': f'Fehler bei der Bildverarbeitung: {str(e)}'
        }), 500


@image_bp.route('/batch', methods=['POST'])
def batch_describe():
    """
    Verarbeitet mehrere Bilder gleichzeitig
    
    Request: JSON { "images": [{"url": "...", "id": "img1"}, ...] }
    
    Response: { success: true, results: [{id: "img1", alt_text: "..."}] }
    """
    data = request.get_json()
    
    if not data or 'images' not in data:
        return jsonify({
            'success': False,
            'error': 'No images provided',
            'message': 'Bitte geben Sie Bilder an.'
        }), 400
    
    images = data['images']
    language = data.get('language', 'de')
    
    if not isinstance(images, list) or len(images) == 0:
        return jsonify({
            'success': False,
            'error': 'Invalid input',
            'message': 'Bitte geben Sie mindestens ein Bild an.'
        }), 400
    
    # Limit batch size
    max_batch_size = 10
    if len(images) > max_batch_size:
        return jsonify({
            'success': False,
            'error': 'Batch too large',
            'message': f'Maximal {max_batch_size} Bilder pro Anfrage erlaubt.'
        }), 400
    
    try:
        from services.image_service import ImageService
        service = ImageService()
        
        results = []
        for img in images:
            img_id = img.get('id', '')
            img_url = img.get('url', '')
            img_context = img.get('context', '')
            
            if not img_url:
                results.append({
                    'id': img_id,
                    'success': False,
                    'error': 'No URL provided'
                })
                continue
            
            try:
                result = service.generate_alt_text_from_url(
                    image_url=img_url,
                    language=language,
                    context=img_context
                )
                results.append({
                    'id': img_id,
                    'success': True,
                    'alt_text': result['alt_text'],
                    'confidence': result.get('confidence', 0.9)
                })
            except Exception as e:
                results.append({
                    'id': img_id,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'processed': len(results),
            'language': language
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Processing error',
            'message': f'Fehler bei der Batch-Verarbeitung: {str(e)}'
        }), 500
