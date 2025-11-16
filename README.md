# BMW Bewerbungstrainer - KI-Bewerbungssimulator

Eine interaktive React-Webanwendung, die ein realistisches, sprachgesteuertes Bewerbungsgespräch für eine Ausbildung zum Mechatroniker bei der BMW Group simuliert.

## 🎯 Projektziel

Diese Anwendung nutzt modernste KI-Technologien, um Bewerbern ein authentisches Übungsgespräch zu ermöglichen:

- **Realistische Sprachinteraktion**: Powered by ElevenLabs mit hyper-realistischer deutscher Stimme
- **KI-Gesprächspartner**: "Herr Müller", ein professioneller Personalverantwortlicher von BMW
- **Intelligentes Feedback**: Detaillierte Auswertung durch Google Gemini

## 🛠️ Technologie-Stack

- **Frontend**: React 18 mit Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Sprach-KI**: ElevenLabs Conversational AI (React SDK)
- **LLM**: Google Gemini Pro (für Feedback-Generierung)
- **UI-Komponenten**: Radix UI + Lucide Icons

## 📋 Voraussetzungen

Bevor du startest, benötigst du:

1. **Node.js** (Version 18 oder höher)
2. **ElevenLabs Account** mit Conversational AI Access
3. **Google Gemini API Key**

## 🚀 Installation & Setup

### 1. Repository klonen & Dependencies installieren

```bash
git clone <repository-url>
cd Bewerbungstrainer
npm install
```

### 2. ElevenLabs Agent erstellen

1. Gehe zu [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Erstelle einen neuen Agenten mit folgenden Einstellungen:

   **System Prompt:**
   ```
   Du bist Herr Müller, ein professioneller und freundlicher Personalverantwortlicher der BMW Group.
   Du führst ein Bewerbungsgespräch für eine Ausbildung zum Mechatroniker.

   Deine Aufgaben:
   - Stelle typische Fragen für ein Bewerbungsgespräch (Motivation, technisches Verständnis, Teamfähigkeit)
   - Sei professionell, aber ermutigend
   - Gib dem Bewerber Zeit zum Antworten
   - Stelle 5-7 Fragen im Verlauf des Gesprächs
   - Am Ende bedanke dich für das Gespräch

   Beginne mit einer freundlichen Begrüßung und der Frage nach einer kurzen Selbstvorstellung.
   ```

   **Stimme:** Wähle eine professionelle deutsche Männerstimme aus der ElevenLabs-Bibliothek

   **LLM-Verbindung:** Verbinde den Agenten mit Google Gemini (oder einem anderen LLM deiner Wahl)

3. Kopiere die **Agent ID** (wird benötigt für `.env`)

### 3. Google Gemini API Key erhalten

1. Besuche [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Erstelle einen neuen API Key
3. Kopiere den Key (wird benötigt für `.env`)

### 4. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Bearbeite `.env` und füge deine Keys ein:

```env
VITE_ELEVENLABS_AGENT_ID=deine_agent_id_hier
VITE_GEMINI_API_KEY=dein_gemini_api_key_hier
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung läuft nun auf `http://localhost:5173`

## 📖 Verwendung

1. **Gespräch starten**: Klicke auf "Start", um die Verbindung zum KI-Agenten herzustellen
2. **Sprechen**: Nutze dein Mikrofon, um auf die Fragen von Herr Müller zu antworten
3. **Feedback erhalten**: Klicke auf "Interview beenden & Feedback erhalten", um eine detaillierte Auswertung zu bekommen

## 🏗️ Projektstruktur

```
src/
├── components/
│   ├── ui/                 # shadcn/ui Komponenten
│   │   ├── button.jsx
│   │   └── dialog.jsx
│   ├── Header.jsx          # BMW-Header mit Logo
│   └── FeedbackModal.jsx   # Feedback-Anzeige Modal
├── services/
│   └── gemini.js          # Gemini API Integration
├── lib/
│   └── utils.js           # Utility-Funktionen
├── App.jsx                # Hauptkomponente
├── main.jsx              # React Entry Point
└── index.css             # Tailwind Styles
```

## 🔧 Verfügbare Scripts

- `npm run dev` - Startet den Entwicklungsserver
- `npm run build` - Erstellt einen Production Build
- `npm run preview` - Vorschau des Production Builds
- `npm run lint` - Führt ESLint aus

## ⚙️ Architektur-Details

### ElevenLabs Integration

Die App nutzt das `@elevenlabs/react` SDK für die Sprachinteraktion:

- **Conversation Component**: Übernimmt automatisch STT (Speech-to-Text), Audio-Streaming und TTS (Text-to-Speech)
- **Agent-basiert**: Der gesamte Gesprächsablauf wird vom ElevenLabs-Agenten gesteuert
- **Kein direkter Gemini-Call im Chat**: Das LLM wird über den ElevenLabs-Agenten angesprochen

### Feedback-Generierung

Für das Feedback wird ein **separater** Gemini API Call durchgeführt:

1. Nach dem Gespräch wird das Transkript extrahiert
2. Ein spezialisierter Karriere-Coach-Prompt analysiert das Gespräch
3. Strukturiertes Feedback wird in einem Modal angezeigt

**Hinweis**: In der aktuellen Version wird ein Mock-Transkript verwendet. Für die Produktion muss die Integration mit der ElevenLabs Conversation History API implementiert werden.

## 🔐 Sicherheit & Best Practices

- ✅ API Keys werden über Umgebungsvariablen verwaltet
- ✅ `.env` ist in `.gitignore` ausgeschlossen
- ✅ Client-seitige Validierung vor API-Calls
- ⚠️ **Wichtig**: Für Production sollten API-Calls über einen Backend-Proxy laufen, um Keys zu schützen

## 🐛 Troubleshooting

### "ElevenLabs Agent ID fehlt"
- Stelle sicher, dass `VITE_ELEVENLABS_AGENT_ID` in `.env` gesetzt ist
- Überprüfe, ob die Agent ID korrekt von der ElevenLabs-Plattform kopiert wurde

### "Gemini API Key fehlt" / Feedback funktioniert nicht
- Stelle sicher, dass `VITE_GEMINI_API_KEY` in `.env` gesetzt ist
- Überprüfe die API-Key-Berechtigungen in Google AI Studio

### Mikrofon funktioniert nicht
- Stelle sicher, dass dein Browser Mikrofonzugriff hat
- Teste in Chrome/Edge (beste Kompatibilität mit Web Audio API)

## 🚧 Bekannte Einschränkungen & TODOs

- [ ] **Transkript-Integration**: Aktuell wird ein Mock-Transkript verwendet. Integration mit ElevenLabs Conversation History API erforderlich
- [ ] **Persistenz**: Gesprächsverläufe werden nicht gespeichert
- [ ] **Multi-User**: Keine Benutzer-Authentifizierung implementiert
- [ ] **Fortschritts-Tracking**: Kein langfristiges Tracking über mehrere Interviews
- [ ] **Backend-Proxy**: API Keys sollten nicht client-seitig exponiert werden

## 📚 Weiterführende Ressourcen

- [ElevenLabs Conversational AI Docs](https://elevenlabs.io/docs/conversational-ai)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

## 📄 Lizenz

[Lizenz einfügen]

## 🤝 Contributing

Beiträge sind willkommen! Bitte beachte die `CLAUDE.md` für Coding-Konventionen und Best Practices.

---

**Entwickelt mit ❤️ für bessere Bewerbungsgespräche**
