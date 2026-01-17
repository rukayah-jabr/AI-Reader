// Rezepte Galerie App - Build-Zeit Alt-Texte
// Keine Backend-Aufrufe mehr nötig

document.addEventListener('DOMContentLoaded', function() {
    // === Navigation zwischen Galerien ===
    const navButtons = document.querySelectorAll('.nav-btn');
    const galleries = document.querySelectorAll('.gallery');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const recipeName = this.dataset.recipe;

            // Aktiven Button markieren
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Alle Galerien ausblenden
            galleries.forEach(gallery => gallery.classList.add('hidden'));

            // Gewählte Galerie anzeigen
            const selectedGallery = document.getElementById(recipeName);
            if (selectedGallery) selectedGallery.classList.remove('hidden');
        });
    });

    // === Screen Reader Optimierung ===
    // Optional: Tabindex und Alt-Text nur bei Fokus
    const images = document.querySelectorAll('.image-card img');
    images.forEach(img => {
        // Bild fokussierbar machen
        img.setAttribute('tabindex', '0');

        // Bei Fokus: Alt-Text nutzen (Screen Reader liest vor)
        img.addEventListener('focus', function() {
            const altText = this.getAttribute('data-alt-text') || this.getAttribute('alt');
            if (altText) this.setAttribute('alt', altText);
        });

        // Bei Blur: Alt-Text wieder leeren
        img.addEventListener('blur', function() {
            this.setAttribute('alt', '');
        });
    });
});
