// Rezepte Galerie App

document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const galleries = document.querySelectorAll('.gallery');

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
});
