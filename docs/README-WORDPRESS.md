# Bewerbungstrainer - WordPress Plugin

AI-gestützter Bewerbungstrainer für realistische Interview-Vorbereitung mit **ElevenLabs Voice AI** und **Google Gemini Feedback**.

## 📋 Beschreibung

Der Bewerbungstrainer ist ein WordPress-Plugin, das Nutzern ermöglicht, realistische Bewerbungsgespräche mit einer KI zu führen und detailliertes Feedback zu erhalten. Das Plugin nutzt:

- **ElevenLabs Conversational AI** für natürliche Voice-Interviews
- **Google Gemini** für intelligentes Feedback
- **WordPress REST API** für Datenverwaltung
- **React** für eine moderne, reaktive Benutzeroberfläche

## ✨ Features

- 🎤 **Voice-basierte Interviews** mit ElevenLabs AI
- 📊 **Detailliertes Feedback** zu Kommunikation, Motivation und Professionalität
- 🎵 **Audio-Analyse** der Sprechweise (Deutlichkeit, Tempo, Nervosität)
- 📝 **Übungsliste** mit allen durchgeführten Gesprächen
- 🔐 **Nutzer-spezifisch** - Nur angemeldete User können das Plugin nutzen
- 💾 **Datenpersistenz** - Alle Übungen werden in der WordPress-Datenbank gespeichert

## 📦 Installation

### Voraussetzungen

- WordPress 6.0 oder höher
- PHP 7.4 oder höher
- Node.js 18+ und npm (für Entwicklung)

### Schritt 1: Repository klonen

```bash
git clone https://github.com/shoukit/Bewerbungstrainer.git
cd Bewerbungstrainer
```

### Schritt 2: Dependencies installieren

```bash
npm install
```

### Schritt 3: React-App bauen

```bash
npm run build
```

Dies erstellt die produktionsreife Version der React-App im `dist/` Verzeichnis.

### Schritt 4: Plugin nach WordPress hochladen

1. Kopiere das gesamte Plugin-Verzeichnis nach `/wp-content/plugins/bewerbungstrainer/`
2. Aktiviere das Plugin in WordPress unter **Plugins > Installierte Plugins**

### Schritt 5: API-Schlüssel konfigurieren

Das Plugin benötigt API-Schlüssel von ElevenLabs und Google Gemini. Diese können über WordPress-Optionen gesetzt werden:

```php
// In functions.php oder über ein Custom-Plugin
update_option('bewerbungstrainer_elevenlabs_agent_id', 'DEINE_ELEVENLABS_AGENT_ID');
update_option('bewerbungstrainer_elevenlabs_api_key', 'DEIN_ELEVENLABS_API_KEY');
update_option('bewerbungstrainer_gemini_api_key', 'DEIN_GEMINI_API_KEY');
```

**Alternativ:** Verwende die `.env`-Datei während der Entwicklung:

```bash
cp .env.example .env
# Bearbeite .env und füge deine API-Schlüssel hinzu
```

## 🚀 Verwendung

### Shortcodes

Das Plugin stellt zwei Shortcodes zur Verfügung:

#### 1. Interview-Funktion

```
[bewerbungstrainer_interview]
```

Zeigt die vollständige Interview-Oberfläche mit:
- User-Wizard (Name, Position, Unternehmen)
- Voice-Interview mit ElevenLabs
- Feedback-Modal mit Bewertung und Audio-Analyse

#### 2. Übungsliste

```
[bewerbungstrainer_uebungen]
```

Zeigt eine Liste aller durchgeführten Übungen mit:
- Datum und Uhrzeit
- Position und Unternehmen
- Bewertung (Sterne-Rating)
- Details-Ansicht mit vollständigem Feedback
- Audio-Wiedergabe

**Attribute:**

- `limit` - Anzahl der Übungen pro Seite (Standard: 20)
- `show_pagination` - Zeige Pagination an (yes/no, Standard: yes)

**Beispiel:**

```
[bewerbungstrainer_uebungen limit="10" show_pagination="yes"]
```

### Seiten erstellen

1. Erstelle eine neue Seite: **Bewerbungstrainer**
   - Füge den Shortcode `[bewerbungstrainer_interview]` ein

2. Erstelle eine neue Seite: **Meine Übungen**
   - Füge den Shortcode `[bewerbungstrainer_uebungen]` ein

3. (Optional) Setze die Seiten als privat oder schütze sie mit einem Plugin wie "Members"

## 🗄️ Datenbank

Das Plugin erstellt bei Aktivierung automatisch die folgende Tabelle:

### `wp_bewerbungstrainer_sessions`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `session_id` | varchar(255) | Eindeutige Session-ID (UUID) |
| `position` | varchar(255) | Position (z.B. "Mechatroniker") |
| `company` | varchar(255) | Unternehmen (z.B. "BMW") |
| `conversation_id` | varchar(255) | ElevenLabs Conversation ID |
| `audio_filename` | varchar(255) | Audio-Dateiname |
| `audio_url` | text | Audio-URL |
| `transcript` | longtext | Gesprächsprotokoll |
| `feedback_json` | longtext | Feedback als JSON |
| `audio_analysis_json` | longtext | Audio-Analyse als JSON |
| `created_at` | datetime | Erstellungsdatum |
| `updated_at` | datetime | Änderungsdatum |

## 🔌 REST API Endpoints

Das Plugin stellt folgende REST API Endpoints zur Verfügung:

### Sessions

- `POST /wp-json/bewerbungstrainer/v1/sessions` - Neue Session erstellen
- `GET /wp-json/bewerbungstrainer/v1/sessions` - Alle Sessions abrufen
- `GET /wp-json/bewerbungstrainer/v1/sessions/{id}` - Einzelne Session abrufen
- `PUT /wp-json/bewerbungstrainer/v1/sessions/{id}` - Session aktualisieren
- `DELETE /wp-json/bewerbungstrainer/v1/sessions/{id}` - Session löschen

### Audio

- `POST /wp-json/bewerbungstrainer/v1/audio/save-elevenlabs` - Audio von ElevenLabs speichern
- `POST /wp-json/bewerbungstrainer/v1/audio/upload` - Audio hochladen (base64)

### User & Settings

- `GET /wp-json/bewerbungstrainer/v1/user/info` - User-Informationen abrufen
- `GET /wp-json/bewerbungstrainer/v1/settings` - Plugin-Einstellungen abrufen

**Authentifizierung:** Alle Endpoints erfordern einen angemeldeten WordPress-User.

## 📁 Verzeichnisstruktur

```
bewerbungstrainer/
├── bewerbungstrainer-plugin.php  # Haupt-Plugin-Datei
├── includes/                      # PHP-Klassen
│   ├── class-database.php         # Datenbank-Management
│   ├── class-api.php              # REST API Endpoints
│   ├── class-audio-handler.php    # Audio-Verwaltung
│   └── class-shortcodes.php       # Shortcode-Handler
├── assets/                        # Assets
│   ├── css/                       # CSS-Dateien
│   │   ├── admin.css              # Admin-Styles
│   │   └── exercises.css          # Übungslisten-Styles
│   └── js/                        # JavaScript
│       └── exercises.js           # Übungslisten-JavaScript
├── dist/                          # React Build (generiert)
│   └── assets/
│       ├── index.js               # React App Bundle
│       └── index.css              # React App Styles
├── src/                           # React Source Code
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   ├── services/
│   └── lib/
├── vite.config.js                 # Vite Build Config
├── package.json                   # Node.js Dependencies
├── README.md                      # Projekt-Dokumentation
└── README-WORDPRESS.md            # WordPress Plugin Dokumentation
```

## 🛠️ Entwicklung

### React-App entwickeln

```bash
# Development Server starten
npm run dev
```

Öffne http://localhost:5173 im Browser.

### React-App bauen

```bash
# Production Build erstellen
npm run build
```

Die Build-Ausgabe wird im `dist/` Verzeichnis erstellt.

### Linting & Code Quality

```bash
# ESLint ausführen
npm run lint
```

## 🔒 Sicherheit

- **User-Authentifizierung:** Nur angemeldete WordPress-User können das Plugin nutzen
- **REST API:** Alle Endpoints prüfen User-Berechtigungen
- **Datensanitization:** Alle Eingaben werden bereinigt und validiert
- **Audio-Speicherung:** Audio-Dateien werden in einem geschützten Verzeichnis gespeichert
- **CSRF-Schutz:** WordPress Nonces werden für alle API-Requests verwendet

## 🌍 Internationalisierung

Das Plugin ist für die Internationalisierung vorbereitet:

- **Text Domain:** `bewerbungstrainer`
- **Domain Path:** `/languages`

Alle Strings sind mit den WordPress i18n-Funktionen (`__()`, `esc_html__()`, etc.) umschlossen.

## 📝 Changelog

### Version 1.0.0 (2025-11-17)

- ✅ Initiale WordPress-Plugin-Version
- ✅ ElevenLabs Voice-Interview Integration
- ✅ Google Gemini Feedback-Generierung
- ✅ Audio-Analyse mit Gemini
- ✅ Datenbank-Integration
- ✅ REST API Endpoints
- ✅ Shortcodes für Interview und Übungsliste
- ✅ Audio-Speicherung und -Wiedergabe
- ✅ Responsive Design

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstelle einen Pull Request oder öffne ein Issue.

## 📄 Lizenz

GPL v2 oder höher. Siehe [LICENSE](LICENSE) für Details.

## 🙋 Support

Bei Fragen oder Problemen:

1. Erstelle ein [GitHub Issue](https://github.com/shoukit/Bewerbungstrainer/issues)
2. Überprüfe die [Dokumentation](README.md)
3. Kontaktiere den Entwickler

## 🔗 Links

- **GitHub Repository:** https://github.com/shoukit/Bewerbungstrainer
- **ElevenLabs:** https://elevenlabs.io
- **Google Gemini:** https://ai.google.dev

---

**Hinweis:** Dieses Plugin befindet sich in aktiver Entwicklung. Feedback und Vorschläge sind willkommen!
