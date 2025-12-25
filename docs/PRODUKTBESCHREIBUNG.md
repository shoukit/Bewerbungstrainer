# Karriereheld – Fachliche Produktbeschreibung

**Version:** 3.0
**Stand:** Dezember 2025
**Status:** Produktiv

---

## 1. Executive Summary

**Karriereheld** ist eine KI-gestützte SaaS-Plattform für professionelles Karriere- und Gesprächstraining. Die Lösung adressiert den wachsenden Bedarf an flexiblen, skalierbaren Trainingsformaten für berufliche Kommunikationssituationen.

### Kernprodukt
Eine WordPress-basierte Webanwendung, die fünf spezialisierte Trainingsmodule bietet:
1. **Smart Briefings** – KI-generierte Wissenspakete
2. **Live-Simulation** – Echtzeit-Sprachgespräche mit KI
3. **Szenario-Training** – Strukturiertes Q&A mit Sofort-Feedback
4. **Wirkungs-Analyse** – Video-Training mit Körpersprache-Analyse
5. **Rhetorik-Gym** – Gamifiziertes Sprechtraining

### Alleinstellungsmerkmale
- **Multimodaler KI-Einsatz**: Kombination von Sprach-KI (ElevenLabs) und Text/Vision-KI (Gemini)
- **Sofortiges Feedback**: Keine Wartezeiten auf menschliche Trainer
- **White-Label-Fähigkeit**: Integration in Partner-Plattformen mit eigenem Branding
- **Ganzheitlicher Ansatz**: Wissen + verbale + nonverbale Kommunikation

---

## 2. Problemstellung

### Herausforderungen im Karriere-Training

| Problem | Auswirkung |
|---------|------------|
| **Kosten menschlicher Trainer** | 150-500 EUR/Stunde begrenzen Zugang |
| **Terminabhängigkeit** | Training nur zu Bürozeiten möglich |
| **Subjektivität** | Feedback variiert je nach Trainer |
| **Skalierbarkeit** | Unternehmensweite Rollouts schwierig |
| **Übungshemmung** | Angst vor menschlicher Bewertung |

### Zielgruppen

| Segment | Bedarf | Lösungsansatz |
|---------|--------|---------------|
| **Bewerber** | Vorstellungsgespräch üben | Live-Simulation, Szenario-Training |
| **Professionals** | Gehaltsverhandlung vorbereiten | Smart Briefings, Szenario-Training |
| **Führungskräfte** | Mitarbeitergespräche führen | Smart Briefings, Video-Training |
| **Vertriebsmitarbeiter** | Kundengespräche optimieren | Live-Simulation, Rhetorik-Gym |
| **HR-Abteilungen** | Mitarbeiter systematisch entwickeln | Alle Module, White-Label |
| **Bildungsträger** | Teilnehmer auf Arbeitsmarkt vorbereiten | White-Label Integration |

---

## 3. Produktmodule im Detail

### 3.1 Smart Briefings

**Zweck:** Schnelle, personalisierte Wissensvorbereitung

**Workflow:**
1. Nutzer wählt Template (z.B. "Gehaltsverhandlung")
2. Nutzer gibt Variablen ein (Position, Unternehmen, etc.)
3. KI generiert strukturiertes Briefing (~10 Sekunden)
4. Nutzer arbeitet interaktives Workbook durch
5. Nutzer fügt eigene Notizen hinzu

**Verfügbare Templates:**
| Template | Kategorie | Variablen |
|----------|-----------|-----------|
| Job Interview Deep-Dive | Karriere | Position, Unternehmen, Interview-Typ |
| Gehaltsverhandlung Prep | Karriere | Position, Aktuelles Gehalt, Zielgehalt |
| Kundengespräch | Vertrieb | Kunde, Branche, Produkt |
| Feedback-Gespräch | Führung | Mitarbeiter, Thema, Ziel |

**Output:**
- 5-8 thematische Sektionen
- Je 5-10 konkrete Tipps/Informationen pro Sektion
- Möglichkeit, weitere Punkte zu generieren
- Persönliche Notizen pro Item

---

### 3.2 Live-Simulation

**Zweck:** Realistische Übung unter Echtzeitbedingungen

**Technologie:** ElevenLabs Conversational AI
- Bidirektionale Sprach-zu-Sprach-Kommunikation
- Automatische Spracherkennung (STT)
- Text-to-Speech mit realistischen Stimmen
- Dynamische Gesprächsführung durch LLM

**Interviewer-Stile:**
| Stil | Beschreibung | Einsatz |
|------|--------------|---------|
| Freundlich | Ermutigend, unterstützend | Anfänger, Selbstvertrauen aufbauen |
| Kritisch | Nachfragend, herausfordernd | Stressresistenz üben |
| Professionell | Sachlich, neutral | Realistische Simulation |

**Analyse nach Session:**
- Vollständiges Transkript
- Inhaltliches Feedback (4 Kategorien)
- Paraverbale Analyse (Füllwörter, Tempo, Tonalität)
- Selbstsicherheits-Score
- Audio-Wiedergabe mit Timestamp-Navigation

---

### 3.3 Szenario-Training

**Zweck:** Systematisches Lernen mit Feedback-Schleife

**Unterschied zu Live-Simulation:**
- Vordefinierte Fragen (nicht dynamisch)
- Feedback nach **jeder** Antwort (nicht erst am Ende)
- Nutzer bestimmt eigenes Tempo
- Wiederholung einzelner Fragen möglich

**Modi:**
| Modus | KI-Rolle | Nutzer-Rolle |
|-------|----------|--------------|
| **INTERVIEW** | Stellt Fragen | Antwortet |
| **SIMULATION** | Spielt Gegenüber (z.B. Kunde) | Führt Gespräch |

**Feedback-Struktur:**
```
Nach jeder Antwort:
- Transkript der Antwort
- Stärken (3-5 Punkte)
- Verbesserungsvorschläge (2-3 Punkte)
- Umsetzbare Tipps (2-3 Punkte)
- Bewertung (0-10 Skala)
- Audio-Analyse (Füllwörter, Tempo)
```

---

### 3.4 Wirkungs-Analyse (Video-Training)

**Zweck:** Nonverbale Kommunikation optimieren

**Analysierte Aspekte:**
| Kategorie | Was wird bewertet |
|-----------|-------------------|
| Auftreten | Erster Eindruck, Gesamtwirkung |
| Selbstbewusstsein | Sicherheit, Authentizität |
| Körpersprache | Haltung, Gestik, Mimik, Blickkontakt |
| Kommunikation | Sprechweise, Klarheit, Struktur |
| Professionalität | Erscheinungsbild, Hintergrund |
| Inhalt | Qualität und Relevanz der Antworten |

**Technologie:** Google Gemini Vision API
- Multimodale Analyse (Video + Audio + Text)
- Frame-by-Frame Körpersprache-Erkennung
- Kombiniertes Feedback für verbale und nonverbale Aspekte

---

### 3.5 Rhetorik-Gym

**Zweck:** Spielerische Verbesserung der Redeflüssigkeit

**Spielmodi:**
| Modus | Dauer | Beschreibung |
|-------|-------|--------------|
| Der Klassiker | 60s | Festes Thema, frei sprechen |
| Zufalls-Thema | 60s | Slot-Machine wählt Thema |
| Stress-Test | 90s | Unerwartete Fragen |

**Scoring-System (100 Punkte max):**
| Kategorie | Punkte | Beschreibung |
|-----------|--------|--------------|
| Wortanzahl | 25 | Redefluss messen |
| Füllwörter | 25 | -5 pro Füllwort |
| Tempo | 10 | 120-150 WPM optimal |
| Inhalt | 40 | KI bewertet Qualität |

**Gamification-Elemente:**
- Persönlicher Highscore
- Durchschnittsberechnung
- Gesamte Übungszeit
- Emoji-Feedback je nach Score

---

## 4. White-Label Partner-System

### Konzept
Partner können Karriereheld unter eigenem Branding in ihre Plattformen integrieren.

### Konfigurierbare Elemente
| Element | Beschreibung |
|---------|--------------|
| Logo | Partner-Logo in Header |
| Farben | Primary Color, Header-Gradient, Button-Styles |
| Module | Welche Trainingsmodule sichtbar sind |
| Szenarien | Partner-spezifische Trainingsszenarien |
| Demo-Codes | Testcodes für Nutzer ohne Account |

### Technische Umsetzung
- Partner-Erkennung via URL-Parameter (`?partner=xxx`)
- CSS-Variablen-Injection für Theming
- REST API für Partner-Konfiguration
- Custom Post Type für Partner-Verwaltung

### Zielgruppen für White-Label
| Partner-Typ | Use Case |
|-------------|----------|
| Bildungsträger | Teilnehmer auf Bewerbungen vorbereiten |
| Personalvermittler | Kandidaten vor Interviews coachen |
| Unternehmen | Interne Weiterbildung |
| Coaching-Plattformen | Ergänzung zu menschlichem Coaching |

---

## 5. Datenmodell

### Session-Typen
| Typ | Tabelle | Hauptfelder |
|-----|---------|-------------|
| Live-Simulation | `wp_bewerbungstrainer_sessions` | conversation_id, transcript, feedback_json, audio_url |
| Szenario-Training | `wp_bewerbungstrainer_simulator_sessions` | scenario_id, questions_json, overall_score |
| Video-Training | `wp_bewerbungstrainer_video_sessions` | video_url, timeline_json, analysis_json |
| Rhetorik-Gym | `wp_bewerbungstrainer_games` | game_mode, topic, score, filler_count |
| Smart Briefings | `wp_bewerbungstrainer_smartbriefing_*` | template_id, variables, sections |

### Szenarien
Alle Trainingsmodule nutzen konfigurierbare Szenarien:
- **Live-Simulation**: WordPress Custom Post Type `roleplay_scenario`
- **Szenario-Training**: Datenbank-Tabelle mit `system_prompt`, `input_configuration`
- **Video-Training**: Datenbank-Tabelle mit `scenario_type`, `feedback_prompt`

---

## 6. KI-Strategie

### Model-Stack
| Dienst | Modell | Einsatz |
|--------|--------|---------|
| ElevenLabs | Conversational AI | Live-Simulation Sprachdialog |
| Gemini | 2.0 Flash | Schnelle Feedback-Generierung |
| Gemini | 1.5 Pro | Komplexe Analysen, Fallback |
| Gemini | Vision | Video-Analyse |

### Prompt-Engineering
- **System-Prompts**: Definieren KI-Rolle und Verhaltensweisen
- **Variablen-Interpolation**: `${position}`, `${company}` für Personalisierung
- **Strukturierte Outputs**: JSON-Schema für konsistentes Feedback
- **Fallback-Strategie**: Automatischer Model-Wechsel bei Fehlern

### Qualitätssicherung
- Temperatur-Einstellungen pro Use Case
- Response-Validierung gegen JSON-Schema
- Retry-Logik mit exponential Backoff
- Logging für Prompt-Optimierung

---

## 7. Metriken & Erfolgsmaße

### Nutzer-KPIs
| Metrik | Beschreibung |
|--------|--------------|
| Completion Rate | Anteil abgeschlossener Sessions |
| Wiederholungsrate | Wie oft Nutzer wiederkommen |
| Score-Entwicklung | Verbesserung über Zeit |
| Feedback-Qualität | NPS für KI-Feedback |

### Produkt-KPIs
| Metrik | Beschreibung |
|--------|--------------|
| Zeit bis Feedback | Latenz der KI-Analyse |
| API-Kosten pro Session | ElevenLabs + Gemini |
| Error Rate | Fehlgeschlagene API-Calls |
| Audio/Video-Qualität | Technische Erfolgsrate |

---

## 8. Roadmap (Ausblick)

### Geplante Erweiterungen
| Feature | Priorität | Beschreibung |
|---------|-----------|--------------|
| Mobile App | Hoch | Native iOS/Android App |
| Team-Features | Hoch | Gruppentraining, Manager-Dashboard |
| Branchen-Templates | Mittel | Spezialisierte Szenarien pro Branche |
| Mehrsprachigkeit | Mittel | Englisch, Französisch, Spanisch |
| Analytics Dashboard | Mittel | Detaillierte Fortschrittsanalysen |
| Avatar-Interviewer | Niedrig | Visueller KI-Gesprächspartner |

---

## 9. Technische Abhängigkeiten

### Externe Services
| Service | Funktion | Criticality |
|---------|----------|-------------|
| ElevenLabs | Sprach-KI | Kritisch für Live-Simulation |
| Google Gemini | Text/Vision-KI | Kritisch für alle Analysen |
| WordPress | Backend-Platform | Kritisch |

### Backup-Strategien
- **Gemini-Fallback**: Automatischer Wechsel zwischen Modellen
- **Offline-Modus**: Smart Briefings können gecached werden
- **Degraded Mode**: Bei API-Ausfall nur Basisfeatures

---

## 10. Glossar

| Begriff | Definition |
|---------|------------|
| **Smart Briefing** | KI-generiertes Vorbereitungsdokument mit strukturierten Tipps |
| **Live-Simulation** | Echtzeit-Sprachgespräch mit KI-Interviewer |
| **Szenario-Training** | Strukturiertes Q&A mit Sofort-Feedback |
| **Wirkungs-Analyse** | Video-Training mit Körpersprache-Feedback |
| **Rhetorik-Gym** | Gamifiziertes Füllwort-Reduktions-Training |
| **White-Label** | Partner-Integration mit eigenem Branding |
| **Conversational AI** | Bidirektionale Sprach-KI-Technologie |
| **Multimodal** | KI-Analyse mehrerer Datentypen (Text, Audio, Video) |

---

**Dokumentenhistorie:**

| Version | Datum | Änderungen |
|---------|-------|------------|
| 3.0 | 2025-12-25 | Vollständige Überarbeitung, alle 5 Module dokumentiert |
| 2.0 | 2025-12-01 | Smart Briefings hinzugefügt |
| 1.0 | 2025-11-01 | Initiale Version |
