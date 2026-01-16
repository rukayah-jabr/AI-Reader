/**
 * FoodShare Demo - AI-Reader Demonstration
 * Setzt alt-Attribute direkt im HTML für Screenreader
 */

document.addEventListener('DOMContentLoaded', function() {
    // ===========================================
    // STATE
    // ===========================================
    let aiEnabled = false;
    let currentRecipeId = null;
    const generatedAltTexts = {};

    // Kontext für AI-Beschreibungen (String-Keys!)
    const recipeContexts = {
        '1': 'Ein saftiger Zitronenkuchen mit Zuckerguss auf einem Teller',
        '2': 'Eine cremige Tomatensuppe in einer Schüssel mit Basilikum',
        '3': 'Ein frischer Caesar Salat mit Romana-Salat, Parmesan und Croutons'
    };

    // ===========================================
    // DOM ELEMENTS
    // ===========================================
    const menuView = document.getElementById('menuView');
    const detailView = document.getElementById('detailView');
    const backToMenu = document.getElementById('backToMenu');
    const showWithoutAI = document.getElementById('showWithoutAI');
    const enableAI = document.getElementById('enableAI');

    // ===========================================
    // NAVIGATION
    // ===========================================
    
    // Klick auf Menü-Karten
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', () => {
            const recipeId = card.dataset.recipeId;
            showRecipeDetail(recipeId);
        });
    });

    // Zurück zum Menü
    backToMenu.addEventListener('click', () => {
        showMenu();
    });

    function showMenu() {
        document.querySelectorAll('.recipe-detail-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        menuView.classList.remove('hidden');
        detailView.classList.add('hidden');
        currentRecipeId = null;
        
        aiEnabled = false;
        showWithoutAI.classList.add('active');
        enableAI.classList.remove('active');
    }

    function showRecipeDetail(recipeId) {
        currentRecipeId = recipeId;
        
        document.querySelectorAll('.recipe-detail-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        const detailSection = document.getElementById(`recipe-detail-${recipeId}`);
        if (detailSection) {
            detailSection.classList.remove('hidden');
        }
        
        menuView.classList.add('hidden');
        detailView.classList.remove('hidden');
        
        aiEnabled = false;
        showWithoutAI.classList.add('active');
        enableAI.classList.remove('active');
        
        // Alt-Text auf leer setzen
        const img = document.getElementById(`detail-image-${recipeId}`);
        if (img) {
            clearAltText(img);
        }
        updateAltDisplay(recipeId, '', false);
        updateEvaluationTable(false);
    }

    // ===========================================
    // AI TOGGLE
    // ===========================================

    // Ohne AI - Alt-Text leeren
    showWithoutAI.addEventListener('click', () => {
        if (!currentRecipeId) return;
        
        aiEnabled = false;
        showWithoutAI.classList.add('active');
        enableAI.classList.remove('active');
        
        const img = document.getElementById(`detail-image-${currentRecipeId}`);
        if (img) {
            clearAltText(img);
        }
        updateAltDisplay(currentRecipeId, '', false);
        updateEvaluationTable(false);
        
        announceToScreenreader('Alt-Text wurde entfernt. Screenreader sagt jetzt nur Grafik.');
    });

    // Mit AI - Alt-Text generieren
    enableAI.addEventListener('click', async () => {
        if (!currentRecipeId) {
            console.error('Kein Rezept ausgewählt!');
            return;
        }
        
        aiEnabled = true;
        enableAI.classList.add('active');
        showWithoutAI.classList.remove('active');
        
        const imgId = `detail-image-${currentRecipeId}`;
        const img = document.getElementById(imgId);
        
        console.log('🔍 Suche Bild:', imgId);
        console.log('🔍 Gefunden:', img);
        
        if (!img) {
            console.error('Bild nicht gefunden:', imgId);
            alert('Fehler: Bild nicht gefunden!');
            return;
        }
        
        const cacheKey = `recipe-${currentRecipeId}`;
        
        // Aus Cache laden falls vorhanden
        if (generatedAltTexts[cacheKey]) {
            console.log('📋 Aus Cache laden:', generatedAltTexts[cacheKey]);
            setAltText(img, generatedAltTexts[cacheKey]);
            updateAltDisplay(currentRecipeId, generatedAltTexts[cacheKey], true);
            updateEvaluationTable(true);
            announceToScreenreader('Bildbeschreibung: ' + generatedAltTexts[cacheKey]);
            return;
        }
        
        // Ladeanimation
        enableAI.disabled = true;
        enableAI.textContent = '⏳ Generiere...';
        updateAltDisplay(currentRecipeId, 'Wird generiert...', false, true);
        
        try {
            console.log('📡 API-Aufruf...');
            console.log('   URL:', img.src);
            console.log('   Context:', recipeContexts[currentRecipeId]);
            
            const response = await fetch('http://localhost:5000/api/image/describe-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: img.src,
                    language: 'de',
                    context: recipeContexts[currentRecipeId]
                })
            });
            
            const result = await response.json();
            console.log('📥 API-Antwort:', result);
            
            if (result.success && result.alt_text) {
                const altText = result.alt_text;
                
                // In Cache speichern
                generatedAltTexts[cacheKey] = altText;
                
                // ALT-TEXT IM HTML SETZEN!
                setAltText(img, altText);
                
                // UI aktualisieren
                updateAltDisplay(currentRecipeId, altText, true);
                updateEvaluationTable(true);
                
                // Screenreader benachrichtigen
                announceToScreenreader('Bildbeschreibung generiert: ' + altText);
                
                console.log('✅ FERTIG! Alt-Text:', img.alt);
            } else {
                throw new Error(result.message || 'Keine Beschreibung erhalten');
            }
        } catch (error) {
            console.error('❌ Fehler:', error);
            updateAltDisplay(currentRecipeId, `Fehler: ${error.message}`, false, false, true);
            announceToScreenreader('Fehler: ' + error.message);
        }
        
        enableAI.disabled = false;
        enableAI.textContent = '🤖 Mit AI-Script';
    });

    // ===========================================
    // ALT-TEXT FUNKTIONEN
    // ===========================================
    
    function setAltText(img, altText) {
        // Alt-Attribut setzen
        img.alt = altText;
        img.setAttribute('alt', altText);
        
        // Zusätzliche Accessibility-Attribute
        img.setAttribute('aria-label', altText);
        img.setAttribute('title', altText);
        
        // Role für Screenreader
        img.setAttribute('role', 'img');
        
        console.log('✅ Alt-Text gesetzt:');
        console.log('   Element:', img.id);
        console.log('   alt=', img.alt);
        console.log('   aria-label=', img.getAttribute('aria-label'));
    }
    
    function clearAltText(img) {
        img.alt = '';
        img.setAttribute('alt', '');
        img.removeAttribute('aria-label');
        img.removeAttribute('title');
    }
    
    function announceToScreenreader(message) {
        const srOutput = document.getElementById('screenreader-output');
        if (srOutput) {
            srOutput.textContent = '';
            setTimeout(() => {
                srOutput.textContent = message;
            }, 100);
        }
    }

    // ===========================================
    // UI UPDATES
    // ===========================================

    function updateAltDisplay(recipeId, altText, hasAlt, isLoading = false, isError = false) {
        const display = document.getElementById(`alt-display-${recipeId}`);
        if (!display) return;
        
        const content = display.querySelector('.alt-text-content');
        const status = display.querySelector('.alt-status');
        
        if (isError) {
            content.textContent = altText;
            status.textContent = '(Fehler)';
            status.className = 'alt-status empty';
        } else if (isLoading) {
            content.textContent = '⏳ ' + altText;
            status.textContent = '(lädt...)';
            status.className = 'alt-status';
        } else if (hasAlt && altText) {
            content.textContent = `"${altText}"`;
            status.textContent = '(AI-generiert ✓)';
            status.className = 'alt-status generated';
        } else {
            content.textContent = '""';
            status.textContent = '(leer - Screenreader sagt nur "Grafik")';
            status.className = 'alt-status empty';
        }
    }

    function updateEvaluationTable(withAI) {
        const evaluations = [
            { id: 'eval-1', good: '✅ Klar verständlich' },
            { id: 'eval-2', good: '✅ Rezept erkennbar' },
            { id: 'eval-3', good: '✅ Zutaten & Details' },
            { id: 'eval-4', good: '✅ Optimal für SR' },
            { id: 'eval-5', good: '✅ Food-Kontext ✓' }
        ];
        
        evaluations.forEach(evalItem => {
            const cell = document.getElementById(evalItem.id);
            if (cell) {
                if (withAI) {
                    cell.textContent = evalItem.good;
                    cell.className = 'rating-good';
                } else {
                    cell.textContent = '⏳ Warte auf AI...';
                    cell.className = 'rating-pending';
                }
            }
        });
    }

    // ===========================================
    // INIT
    // ===========================================
    console.log('🍽️ FoodShare Demo geladen');
    console.log('📋 Alt-Texte werden direkt im HTML gesetzt');
});
