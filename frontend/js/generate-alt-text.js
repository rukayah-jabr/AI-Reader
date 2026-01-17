import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// === Konfiguration ===
const BACKEND_URL = 'http://localhost:5000/api/image/describe-url';
const HTML_FILE = path.join('..', 'index.html'); // Pfad zur HTML-Datei

// Hilfsfunktion: sendet Request ans Backend
async function getAltText(imageUrl, recipeName) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                url: imageUrl,
                language: 'de',
                context: `Rezept: ${recipeName}`
            })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.success && data.alt_text ? data.alt_text : null;
    } catch (err) {
        console.error(`Fehler bei ${imageUrl}: ${err.message}`);
        return null;
    }
}

// Hauptfunktion: HTML einlesen, Bilder finden, Alt-Texte einsetzen
async function generateAltTexts() {
    let html = fs.readFileSync(HTML_FILE, 'utf-8');

    // Regex: <img src="..." alt="">
    const imgRegex = /<img\s+([^>]*?)src="([^"]+)"([^>]*?)alt="(.*?)"([^>]*?)>/gi;

    const matches = [...html.matchAll(imgRegex)];

    for (const match of matches) {
        const fullTag = match[0];
        const beforeSrc = match[1];
        const src = match[2];
        const afterSrc = match[3] + match[5]; // restliche Attribute
        // Versuche Rezept aus nächster Gallery-ID zu erkennen
        const galleryRegex = new RegExp(`<section[^>]+id="([^"]+)"[^>]*>`, 'gi');
        let recipeName = 'unbekannt';
        let lastIndex = html.indexOf(fullTag);
        let sectionMatch;
        while ((sectionMatch = galleryRegex.exec(html)) !== null) {
            if (sectionMatch.index < lastIndex) recipeName = sectionMatch[1];
            else break;
        }

        // Backend-Abfrage
        const altText = await getAltText(src, recipeName) || `Bild aus ${recipeName}`;

        // Neues Tag mit Alt-Text
        const newTag = `<img ${beforeSrc}src="${src}"${afterSrc} alt="${altText}">`;

        html = html.replace(fullTag, newTag);
        console.log(`✅ ${recipeName}: ${altText}`);
    }

    fs.writeFileSync(HTML_FILE, html, 'utf-8');
    console.log('✨ Alt-Texte erfolgreich in HTML eingefügt!');
}

// Ausführen
generateAltTexts();
