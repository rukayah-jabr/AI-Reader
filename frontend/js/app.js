// Rezepte Galerie App

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

    // Screen Reader: Alt-Text nur bei Focus/Click vorlesen
    images.forEach(img => {
        // Speichere den Original alt-text in einem data-attribute
        const altText = img.getAttribute('alt');
        img.setAttribute('data-alt-text', altText);
        
        // Leere den alt-Text anfangs (damit Screen Reader nicht automatisch vorliest)
        img.setAttribute('alt', '');
        
        // Tabindex hinzufügen damit Bilder fokussierbar sind
        img.setAttribute('tabindex', '0');
        
        // Bei Focus: Alt-Text hinzufügen (Screen Reader liest es vor)
        img.addEventListener('focus', function() {
            this.setAttribute('alt', this.getAttribute('data-alt-text'));
        });
        
        // Bei Blur: Alt-Text wieder entfernen
        img.addEventListener('blur', function() {
            this.setAttribute('alt', '');
        });
    });
});
