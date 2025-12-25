# Karriereheld - KI-gestütztes Karriere- und Gesprächstraining

**Karriereheld** ist ein umfassendes WordPress-Plugin für KI-gestützte Karriere- und Gesprächsvorbereitung. Die Anwendung kombiniert sprachbasierte KI-Interaktion, intelligente Feedback-Generierung und strukturierte Wissensvermittlung zu einem ganzheitlichen Trainingssystem.

## Vision

Menschen dabei unterstützen, selbstbewusst und optimal vorbereitet in wichtige berufliche Gespräche zu gehen – sei es ein Vorstellungsgespräch, eine Gehaltsverhandlung oder ein wichtiges Kundengespräch.

## Hauptfunktionen

| Modul | Beschreibung |
|-------|--------------|
| **Smart Briefings** | KI-generierte Wissenspakete zur optimalen Vorbereitung auf spezifische Gespräche |
| **Live-Simulation** | Realistische Echtzeit-Gespräche mit KI-Interviewer (ElevenLabs Conversational AI) |
| **Szenario-Training** | Strukturiertes Q&A mit sofortigem Feedback nach jeder Antwort |
| **Wirkungs-Analyse** | Video-Training mit Körpersprache- und Präsenz-Analyse |
| **Rhetorik-Gym** | Gamifiziertes Sprechtraining zur Reduzierung von Füllwörtern |

## Technologie-Stack

### Frontend
- **React 18** mit JSX
- **Vite** als Build-Tool
- **Tailwind CSS** für Styling
- **Radix UI** für barrierefreie Komponenten
- **Framer Motion** für Animationen

### KI-Integration
- **ElevenLabs Conversational AI** für bidirektionale Sprachinteraktion
- **Google Gemini API** für Feedback-Generierung und Audio-/Video-Analyse

### Backend
- **WordPress 6.0+** mit REST API
- **PHP 7.4+**
- **MySQL** (via WordPress)
- **DomPDF** für PDF-Export

## Schnellstart

### Voraussetzungen
- Node.js 18+
- PHP 7.4+
- WordPress 6.0+
- Composer (für PHP-Dependencies)

### Installation

```bash
# Repository klonen
git clone https://github.com/shoukit/Bewerbungstrainer.git
cd Bewerbungstrainer

# Frontend-Dependencies installieren
npm install

# PHP-Dependencies installieren
composer install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env bearbeiten und API-Keys eintragen
```

### Entwicklung

```bash
# Entwicklungsserver starten
npm run dev

# Production Build erstellen
npm run build
```

### WordPress-Integration

1. Plugin-Verzeichnis nach WordPress kopieren:
   ```bash
   cp -r . /wp-content/plugins/bewerbungstrainer/
   ```

2. Plugin in WordPress Admin aktivieren

3. API-Keys in WordPress-Optionen konfigurieren:
   - `bewerbungstrainer_elevenlabs_agent_id`
   - `bewerbungstrainer_elevenlabs_api_key`
   - `bewerbungstrainer_gemini_api_key`

4. Shortcodes verwenden:
   - `[bewerbungstrainer_interview]` - Haupt-App

## Dokumentation

Ausführliche Dokumentation befindet sich im `docs/` Ordner:

| Dokument | Beschreibung |
|----------|--------------|
| [CLAUDE.md](./CLAUDE.md) | Entwickler-Leitfaden mit vollständiger technischer Dokumentation |
| [docs/PRODUKTBESCHREIBUNG.md](./docs/PRODUKTBESCHREIBUNG.md) | Fachliche Produktdokumentation |
| [docs/FUNKTIONALES_DESIGN.md](./docs/FUNKTIONALES_DESIGN.md) | Funktionales Design und Benutzerflows |
| [docs/TECHNISCHE_DOKUMENTATION.md](./docs/TECHNISCHE_DOKUMENTATION.md) | Technische Architektur und API-Referenz |
| [docs/MARKETING.md](./docs/MARKETING.md) | Marketingkonzept und Go-to-Market-Strategie |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Fehlerbehebung und häufige Probleme |

### Content-Guides für Szenario-Erstellung

| Guide | Beschreibung |
|-------|--------------|
| [docs/SCENARIO_TRAINING_CONTENT_GUIDE.md](./docs/SCENARIO_TRAINING_CONTENT_GUIDE.md) | Anleitung zur Erstellung von Szenario-Training-Inhalten |
| [docs/VIDEO_TRAINING_CONTENT_GUIDE.md](./docs/VIDEO_TRAINING_CONTENT_GUIDE.md) | Anleitung zur Erstellung von Video-Training-Inhalten |
| [docs/SMART_BRIEFING_CONTENT_GUIDE.md](./docs/SMART_BRIEFING_CONTENT_GUIDE.md) | Anleitung zur Erstellung von Smart Briefing-Templates |

## Verfügbare Scripts

```bash
npm run dev          # Vite Dev-Server starten
npm run build        # Production Build erstellen
npm run preview      # Production Build lokal testen
npm run lint         # ESLint ausführen
npm run clean        # Build-Artefakte und node_modules löschen
npm run fresh        # Komplett neu installieren
npm run rebuild      # Cache löschen und neu bauen
```

## Kernvorteile

- **Kein menschlicher Trainer nötig** – Üben jederzeit und überall möglich
- **Sofortiges, objektives Feedback** – KI analysiert ohne Vorurteile
- **Personalisierte Vorbereitung** – Briefings und Training auf spezifische Situation zugeschnitten
- **Ganzheitlicher Ansatz** – Wissen + verbale + nonverbale Kommunikation
- **White-Label-fähig** – Integration in Partner-Plattformen mit eigenem Branding

## Sicherheit

- API-Keys werden über WordPress-Optionen oder Umgebungsvariablen verwaltet
- Alle REST API Endpoints nutzen WordPress Nonces
- Input-Sanitization für alle Benutzereingaben
- Prepared Statements für Datenbankabfragen

## Lizenz

Proprietär - Alle Rechte vorbehalten

## Support

Bei Fragen oder Problemen:
- [Troubleshooting Guide](./TROUBLESHOOTING.md) konsultieren
- Issue im GitHub Repository erstellen

---

**Entwickelt für bessere Karrierechancen durch optimale Gesprächsvorbereitung**
