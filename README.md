# AI-Reader 🤖📖 (AI-Generated Branch)

> **Automatische KI-gestützte Alt-Text-Generierung** - Bilder werden dynamisch beim Laden analysiert

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?logo=flask)](https://flask.palletsprojects.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4V-412991?logo=openai)](https://openai.com)
[![Node.js](https://img.shields.io/badge/Node.js-npm-339933?logo=node.js)](https://nodejs.org)

---

## 🎯 Branch-Besonderheit: AI-Generated

Dieser Branch unterscheidet sich vom `simple` Branch durch **automatische Alt-Text-Generierung**:

| Feature | simple Branch | ai-generated Branch |
|---------|---------------|---------------------|
| Alt-Texte | Statisch im HTML | **Dynamisch via KI generiert** |
| Backend-Aufruf | Bei User-Interaktion | **Automatisch beim Laden** |
| Bilder `alt=""` | Vordefiniert | **Leer → KI füllt sie** |

### Ablauf:
```
1. Seite lädt → Bilder haben leere alt=""
2. JavaScript ruft Backend API für jedes Bild auf
3. GPT-4 Vision analysiert jedes Bild
4. Alt-Texte werden in data-alt-text gespeichert
5. Bei Focus wird der generierte Alt-Text angezeigt
```

---

## 🏗️ Projektstruktur

```
AI-Reader/
├── backend/
│   ├── app.py              # Flask Application Factory
│   ├── config.py           # Konfiguration
│   ├── routes/
│   │   ├── image_routes.py # POST /api/image/describe-url
│   │   ├── audio_routes.py
│   │   └── health_routes.py
│   └── services/
│       ├── image_service.py # GPT-4 Vision Integration
│       └── audio_service.py
├── frontend/
│   ├── index.html          # Demo: Rezepte Galerie
│   ├── package.json        # npm Scripts (serve, dev)
│   ├── css/styles.css
│   └── js/
│       └── app.js          # 🔥 Automatische Alt-Text-Generierung
├── requirements.txt
└── .env.example
```

---

## 🚀 Schnellstart

### 1. Repository klonen
```bash
git clone https://github.com/rukayah-jabr/AI-Reader.git
cd AI-Reader
git checkout ai-generated
```

### 2. Backend einrichten

```bash
# Python Virtual Environment
python -m venv venv
.\venv\Scripts\activate    # Windows
# source venv/bin/activate # Linux/Mac

# Dependencies installieren
pip install -r requirements.txt

# API-Key konfigurieren
copy .env.example .env
# .env bearbeiten: OPENAI_API_KEY=sk-...

# Backend starten
cd backend
python app.py
```
🟢 Backend läuft auf `http://localhost:5000`

### 3. Frontend starten

```bash
cd frontend

# Option A: Mit npm
npm install
npm run dev

# Option B: Mit Python
python -m http.server 8000
```
🌐 Frontend auf `http://localhost:8000`

---

## 🔄 Wie die Alt-Text-Generierung funktioniert

### Frontend (`js/app.js`)

```javascript
// Beim Laden werden alle Bilder analysiert
const BACKEND_URL = 'http://localhost:5000/api/image/describe-url';

async function generateAltTexts(images) {
    for (const img of images) {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            body: JSON.stringify({
                url: img.src,
                language: 'de',
                context: `Rezept: ${recipeName}`
            })
        });
        const data = await response.json();
        img.setAttribute('data-alt-text', data.alt_text);
    }
}
```

### Backend Endpoint

```http
POST /api/image/describe-url
Content-Type: application/json

{
  "url": "https://example.com/bild.jpg",
  "language": "de",
  "context": "Rezept: Zitronenkuchen"
}
```

**Response:**
```json
{
  "success": true,
  "alt_text": "Goldgelber Zitronenkuchen mit Puderzucker, garniert mit Zitronenscheiben"
}
```

---

## 📡 API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/image/describe-url` | POST | Alt-Text für Bild-URL generieren |
| `/api/audio/transcribe` | POST | Audio transkribieren |
| `/api/health` | GET | Health Check |

---

## 🔧 Konfiguration

### `.env` Datei

```env
OPENAI_API_KEY=sk-...          # Erforderlich für GPT-4 Vision
GOOGLE_AI_API_KEY=...          # Optional (Fallback)
FLASK_DEBUG=True
PORT=5000
```

### `package.json` Scripts

```json
{
  "scripts": {
    "serve": "http-server . -p 8000 -c-1",
    "dev": "http-server . -p 8000 -c-1 --open"
  }
}
```

---

## 🎨 Demo: Rezepte Galerie

Die Demo zeigt **dynamische Alt-Text-Generierung** für Rezeptbilder:

| Rezept | Bilder | Alt-Text Beispiel |
|--------|--------|-------------------|
| 🍰 Zitronenkuchen | 3 | *"Saftiger Gugelhupf mit Zitronenglasur"* |
| 🍲 Tomatensuppe | 3 | *"Cremige rote Suppe mit Basilikum"* |
| 🥗 Caesar Salat | 3 | *"Frischer Salat mit Parmesan und Croutons"* |

**Console-Output beim Laden:**
```
🎨 Generiere Alt-Texte für 9 Bilder...
📤 Sende Request für zitronenkuchen...
✅ zitronenkuchen: "Goldgelber Zitronenkuchen..."
✨ Alt-Text Generierung abgeschlossen!
```

---

## 🆚 Vergleich der Branches

| Aspekt | `simple` | `ai-generated` |
|--------|----------|----------------|
| **Workflow** | Alt-Text statisch | Alt-Text dynamisch generiert |
| **API-Aufrufe** | Bei Nutzer-Aktion | Automatisch beim Laden |
| **Use Case** | Manuell gepflegte Bilder | CMS/dynamische Inhalte |
| **API-Kosten** | Niedrig | Höher (jedes Bild = 1 Request) |

---

## 👥 Team

**Autoren:** Rukayah Jabr, Fadime Konuk, Lulu Wang

Entwickelt im Rahmen des **Web Engineering Hackathons** an der FH Campus Wien.

---

## 📄 Lizenz

MIT License

---

<div align="center">

**🤖 Accessibility durch KI - Automatisch & Barrierefrei**

</div>
