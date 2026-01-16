# AI-Reader 🤖

> KI-gestütztes Tool für automatische Accessibility für Bilder und Audios in dynamischen Web Apps

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-red.svg)](https://flask.palletsprojects.com)

## 📋 Überblick

AI-Reader ist ein Prototyp, der im Rahmen des **Web Engineering Hackathons** an der Hochschule Campus Wien entwickelt wurde. Das Tool automatisiert die Erstellung von Accessibility-Metadaten für Medieninhalte:

- **🖼️ Alt-Text-Generierung**: Automatische Bildbeschreibungen für Screenreader
- **🎵 Audio-Transkription**: Speech-to-Text für Audioinhalte
- **⚡ Dynamische Integration**: Nahtlose Einbindung in moderne Web-Apps

## 🎯 Motivation

Barrierefreiheit (Accessibility) ist durch **WCAG** und den **European Accessibility Act** klar geregelt. Dennoch fehlen vielen Webanwendungen grundlegende Accessibility-Features wie Alt-Texte und Transkripte. AI-Reader automatisiert diese Aufgaben und entlastet Entwicklerteams.

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Browser)                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │    HTML     │    │ JavaScript  │    │   AI-Reader.js      │  │
│  │  <img>      │◄───│   Library   │◄───│   DOM Manipulation  │  │
│  │  <audio>    │    │             │    │                     │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Flask Server)                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Routes    │    │  Services   │    │      Config         │  │
│  │  /image/*   │───►│ ImageService│───►│  API Keys           │  │
│  │  /audio/*   │    │ AudioService│    │  Settings           │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Externe KI-APIs                             │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   OpenAI GPT-4V     │    │      OpenAI Whisper             │ │
│  │   Bilderkennung     │    │      Speech-to-Text             │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Repository klonen

```bash
git clone <repository-url>
cd AI-Reader
```

### 2. Backend einrichten

```bash
# Virtual Environment erstellen
python -m venv venv

# Aktivieren (Windows)
venv\Scripts\activate

# Aktivieren (macOS/Linux)
source venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt
```

### 3. API-Keys konfigurieren

```bash
# .env Datei erstellen
cp .env.example .env

# .env bearbeiten und API-Key eintragen
# OPENAI_API_KEY=sk-your-api-key-here
```

### 4. Backend starten

```bash
cd backend
python app.py
```

Der Server läuft auf `http://localhost:5000`

### 5. Frontend öffnen

Öffnen Sie `frontend/index.html` in Ihrem Browser oder starten Sie einen lokalen Server:

```bash
# Mit Python
cd frontend
python -m http.server 3000

# Oder mit VS Code Live Server Extension
```

## 📁 Projektstruktur

```
AI-Reader/
├── backend/
│   ├── app.py              # Flask Hauptanwendung
│   ├── config.py           # Konfigurationsverwaltung
│   ├── routes/
│   │   ├── health_routes.py    # Health Check Endpoints
│   │   ├── image_routes.py     # Bild-API Endpoints
│   │   └── audio_routes.py     # Audio-API Endpoints
│   └── services/
│       ├── image_service.py    # KI-Bilderkennung
│       └── audio_service.py    # KI-Transkription
├── frontend/
│   ├── index.html          # Demo-Webseite
│   ├── css/
│   │   └── styles.css      # Styling
│   └── js/
│       ├── ai-reader.js    # Haupt-Library
│       └── demo.js         # Demo-Logik
├── requirements.txt        # Python Dependencies
├── .env.example           # Beispiel-Konfiguration
└── README.md
```

## 🔌 API Referenz

### Health Check

```http
GET /api/health
```

### Bild beschreiben (Upload)

```http
POST /api/image/describe
Content-Type: multipart/form-data

image: <file>
language: de|en
context: <optional context>
```

### Bild beschreiben (URL)

```http
POST /api/image/describe-url
Content-Type: application/json

{
  "url": "https://example.com/image.jpg",
  "language": "de",
  "context": "Website Header"
}
```

### Audio transkribieren (Upload)

```http
POST /api/audio/transcribe
Content-Type: multipart/form-data

audio: <file>
language: de|en
```

### Audio transkribieren (URL)

```http
POST /api/audio/transcribe-url
Content-Type: application/json

{
  "url": "https://example.com/audio.mp3",
  "language": "de"
}
```

## 💻 JavaScript Integration

### Basis-Verwendung

```html
<script src="js/ai-reader.js"></script>
<script>
  const aiReader = new AIReader({
    apiUrl: 'http://localhost:5000/api',
    language: 'de',
    autoScan: true
  });
  
  // Automatisch alle Bilder und Audios verarbeiten
  aiReader.init();
</script>
```

### Erweiterte Konfiguration

```javascript
const aiReader = new AIReader({
  apiUrl: 'http://localhost:5000/api',
  language: 'de',
  autoScan: true,
  scanInterval: 5000,
  batchSize: 10,
  debug: true,
  
  onImageProcessed: (element, response) => {
    console.log('Alt-Text generiert:', response.alt_text);
  },
  
  onAudioProcessed: (element, response) => {
    console.log('Transkript erstellt:', response.transcript);
  },
  
  onError: (error) => {
    console.error('Fehler:', error);
  }
});
```

### Manuelle Verarbeitung

```javascript
// Einzelnes Bild verarbeiten
const img = document.querySelector('#myImage');
await aiReader.processImage(img);

// Einzelne Audio verarbeiten
const audio = document.querySelector('#myAudio');
await aiReader.processAudio(audio);

// Alle unverarbeiteten Elemente scannen
await aiReader.scanAndProcess();
```

## ⚙️ Konfiguration

### Umgebungsvariablen (.env)

| Variable | Beschreibung | Default |
|----------|--------------|---------|
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `GOOGLE_AI_API_KEY` | Google AI API Key (Alternative) | - |
| `FLASK_ENV` | Environment (development/production) | development |
| `PORT` | Server Port | 5000 |
| `DEFAULT_LANGUAGE` | Standardsprache | de |
| `ALT_TEXT_MAX_LENGTH` | Max. Länge Alt-Text | 250 |

## 📊 Technologien

### Backend
- **Flask 3.0** - Web Framework
- **OpenAI API** - GPT-4 Vision & Whisper
- **Flask-CORS** - Cross-Origin Support

### Frontend
- **Vanilla JavaScript** - Keine Dependencies
- **Modern CSS** - CSS Variables, Grid, Flexbox
- **Fetch API** - HTTP Requests

### KI-Services
- **GPT-4 Vision** - Bilderkennung
- **Whisper** - Speech-to-Text
- **Google Gemini** (Alternative)

## ⚠️ Limitationen

- Das Tool garantiert keine vollständige WCAG-Konformität
- KI-generierte Inhalte können ungenau sein
- Es werden nur Bilder und Audios unterstützt (keine Videos)
- Keine Unterstützung für ARIA-Rollen oder Versionierung

## 👥 Team

- **Fadime Konuk**
- **Rukayah Jabr**
- **Lulu Wang**

Hochschule Campus Wien | Software Design & Engineering

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 🔗 Referenzen

- [WCAG Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [European Accessibility Act](https://digital-strategy.ec.europa.eu/en/policies/european-accessibility-act)
- [WebAIM](https://webaim.org/)
- [OpenAI API](https://platform.openai.com/docs/)
