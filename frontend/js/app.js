// Rezepte Galerie App mit Backend Alt-Text Generierung

const BACKEND_URL = 'http://localhost:5000/api/image/describe-url';

document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const galleries = document.querySelectorAll('.gallery');
    const images = document.querySelectorAll('.image-card img');

    // Navigation zwischen Galerien
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const recipeName = this.getAttribute('data-recipe');
            
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all galleries
            galleries.forEach(gallery => gallery.classList.add('hidden'));
            
            // Show selected gallery
            const selectedGallery = document.getElementById(recipeName);
            if (selectedGallery) {
                selectedGallery.classList.remove('hidden');
            }
        });
    });

    // Generiere Alt-Texte beim Laden
    generateAltTexts(images);

    // Screen Reader: Alt-Text nur bei Focus/Click vorlesen
    images.forEach(img => {
        // Tabindex hinzufügen damit Bilder fokussierbar sind
        img.setAttribute('tabindex', '0');
        
        // Bei Focus: Alt-Text hinzufügen (Screen Reader liest es vor)
        img.addEventListener('focus', function() {
            const altText = this.getAttribute('data-alt-text');
            if (altText) {
                this.setAttribute('alt', altText);
            }
        });
        
        // Bei Blur: Alt-Text wieder entfernen
        img.addEventListener('blur', function() {
            this.setAttribute('alt', '');
        });
    });
});

/**
 * Generiert Alt-Texte für alle Bilder vom Backend
 */
async function generateAltTexts(images) {
    console.log(`🎨 Generiere Alt-Texte für ${images.length} Bilder...`);
    console.log(`Backend URL: ${BACKEND_URL}`);
    
    for (const img of images) {
        const imageUrl = img.getAttribute('src');
        const recipeName = img.closest('.gallery')?.id || 'unbekannt';
        
        try {
            console.log(`📤 Sende Request für ${recipeName}...`);
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: imageUrl,
                    language: 'de',
                    context: `Rezept: ${recipeName}`
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Response:`, data);
            
            if (data.success && data.alt_text) {
                img.setAttribute('data-alt-text', data.alt_text);
                img.setAttribute('alt', ''); // Bleibt leer für Screen Reader (nur bei Focus)
                console.log(`✅ ${recipeName}: "${data.alt_text}"`);
            } else {
                console.warn(`⚠️ Fehler bei ${recipeName}:`, data.message || 'Unbekannter Fehler');
                // Fallback: Nutze original alt-text
                const origAlt = img.getAttribute('alt') || `Bild aus ${recipeName}`;
                img.setAttribute('data-alt-text', origAlt);
            }
        } catch (error) {
            console.error(`❌ Fehler beim Abrufen von ${recipeName}:`, error);
            console.error(`Details:`, error.message);
            // Fallback: Nutze original alt-text
            const origAlt = img.getAttribute('alt') || `Bild aus ${recipeName}`;
            img.setAttribute('data-alt-text', origAlt);
        }
    }
    
    console.log('✨ Alt-Text Generierung abgeschlossen!');
}
