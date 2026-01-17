# AI-Reader 🤖📖

> **KI-gestütztes Accessibility-Tool** für automatische Alt-Text-Generierung und Audio-Transkription in Web-Anwendungen

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?logo=flask)](https://flask.palletsprojects.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4V%20%26%20Whisper-412991?logo=openai)](https://openai.com)

---

## 🎯 Was ist AI-Reader?

AI-Reader automatisiert **Barrierefreiheit** für Webanwendungen durch:

| Feature | Beschreibung |
|---------|-------------|
| 🖼️ **Alt-Text-Generierung** | Automatische Bildbeschreibungen via GPT-4 Vision |
| 🎵 **Audio-Transkription** | Speech-to-Text mit OpenAI Whisper |
| 🌐 **REST API** | Einfache Integration in bestehende Apps |

---

## 🏗️ Projektstruktur

```
AI-Reader/
├── backend/
│   ├── app.py              # Flask Application Factory
│   ├── config.py           # Konfiguration
│   ├── routes/
│   │   ├── image_routes.py # /api/image/* Endpoints
│   │   ├── audio_routes.py # /api/audio/* Endpoints
│   │   └── health_routes.py
│   └── services/
│       ├── image_service.py # GPT-4 Vision Integration
│       └── audio_service.py # Whisper Integration
├── frontend/
│   ├── index.html          # Demo: Rezepte Galerie
│   ├── css/styles.css
│   └── js/app.js           # Screen Reader Integration
├── requirements.txt
└── .env.example
```

---

## 🚀 Schnellstart

### 1. Repository klonen
```bash
git clone https://github.com/rukayah-jabr/AI-Reader.git
cd AI-Reader
```

### 2. Python-Umgebung einrichten
```bash
python -m venv venv
.\venv\Scripts\activate    # Windows
# source venv/bin/activate # Linux/Mac

pip install -r requirements.txt
```

### 3. API-Keys konfigurieren
```bash
copy .env.example .env
# Dann .env bearbeiten und API-Keys eintragen
```

**Benötigte Keys:**
- `OPENAI_API_KEY` - für GPT-4 Vision & Whisper
- `GOOGLE_AI_API_KEY` - optional, für Gemini als Fallback

### 4. Backend starten
```bash
cd backend
python app.py
```
🟢 Server läuft auf `http://localhost:5000`

### 5. Frontend öffnen
Öffne `frontend/index.html` im Browser oder starte einen lokalen Server:
```bash
cd frontend
python -m http.server 5500
```
🌐 Dann `http://localhost:5500` aufrufen

---

## 📡 API Endpoints

### Bild → Alt-Text

```http
POST /api/image/analyze
Content-Type: application/json

{
  "image_url": "https://example.com/bild.jpg",
  "language": "de"
}
```

**Response:**
```json
{
  "success": true,
  "alt_text": "Goldgelber Zitronenkuchen mit Puderzucker auf weißem Teller"
}
```

### Audio → Transkript

```http
POST /api/audio/transcribe
Content-Type: multipart/form-data

audio: [Audiodatei]
language: de
```

**Response:**
```json
{
  "success": true,
  "transcript": "Die Tomatensuppe wird mit frischen Kräutern serviert.",
  "duration": 5.2
}
```

### Health Check

```http
GET /api/health
```

---

## 🔧 Konfiguration

| Variable | Beschreibung | Standard |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API-Key | *erforderlich* |
| `GOOGLE_AI_API_KEY` | Google Gemini Key | *optional* |
| `FLASK_DEBUG` | Debug-Modus | `True` |
| `PORT` | Server-Port | `5000` |
| `ALLOWED_ORIGINS` | CORS-Origins | `localhost` |

---

## 🎨 Demo-Anwendung

Die enthaltene **Rezepte Galerie** demonstriert die Integration:

- 🍰 Zitronenkuchen
- 🍲 Tomatensuppe  
- 🥗 Caesar Salat

**Screen Reader Feature:** Alt-Texte werden nur bei Fokus vorgelesen (nicht automatisch beim Laden).

---

## 📚 Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| **Backend** | Python 3.10+, Flask 3.0 |
| **KI-Services** | OpenAI GPT-4 Vision, Whisper |
| **Frontend** | Vanilla JS, CSS3 |
| **APIs** | RESTful JSON |

---

## 🤝 Entstehung

Entwickelt im Rahmen des **Web Engineering Hackathons** an der FH Campus Wien.

**Ziel:** Automatisierung von WCAG-konformen Accessibility-Features für dynamische Webanwendungen.

---

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

<div align="center">

**Made with ❤️ for Accessibility**

</div>
