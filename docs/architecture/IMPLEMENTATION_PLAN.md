# Implementierungsplan - Bewerbungstrainer Refactoring

**Gesamtdauer**: 3-4 Wochen
**Start**: 2025-11-24
**Team**: 1-2 Entwickler

---

## 📅 Timeline

```
Woche 1: Infrastructure & Shared Layer
Woche 2: Routing & Interview-Modul Migration
Woche 3: Situations-Coach Backend & Frontend
Woche 4: Testing, Refinement & Deployment
```

---

## 🎯 Woche 1: Infrastructure & Shared Layer

### Tag 1-2: Setup & Dependencies

**Ziel**: Projekt-Basis vorbereiten

#### Tasks:
- [x] Architektur-Dokumentation erstellen
- [ ] Dependencies installieren
  ```bash
  npm install react-router-dom@6
  npm install --save-dev @types/react-router-dom  # optional
  ```
- [ ] Ordnerstruktur anlegen
  ```bash
  mkdir -p src/{modules,shared,routes,pages}
  mkdir -p src/shared/{components,hooks,contexts,services,utils}
  mkdir -p src/shared/components/{layout,feedback,audio,user,ui,common}
  mkdir -p src/shared/services/{api,audio,feedback,storage}
  mkdir -p src/modules/interview-trainer/{components,hooks,services}
  mkdir -p src/modules/situations-coach/{components,hooks,services}
  mkdir -p docs/architecture
  ```
- [ ] Vite Config anpassen (Path Aliases)
- [ ] Git Branch erstellen: `git checkout -b refactor/modular-architecture`

**Deliverables**:
- ✅ Saubere Ordnerstruktur
- ✅ Dependencies installiert
- ✅ Vite konfiguriert

---

### Tag 3-4: Shared Layer - Contexts & Hooks

**Ziel**: Zentrale State-Management-Schicht

#### Tasks:

**Contexts erstellen**:
- [ ] `src/shared/contexts/UserContext.jsx`
  - User state (logged-in vs. guest)
  - User data (name, position, company)
  - Update/clear methods
- [ ] `src/shared/contexts/AppConfigContext.jsx`
  - WordPress detection
  - API keys
  - Feature flags
- [ ] `src/shared/contexts/index.js`
  - Combined AppProviders
  - Export hooks

**Core Hooks erstellen**:
- [ ] `src/shared/hooks/useUser.js`
  - Wrapper für UserContext
- [ ] `src/shared/hooks/useLocalStorage.js`
  - Persistent state helper
- [ ] `src/shared/hooks/useDebounce.js`
  - Utility hook

**Deliverables**:
- ✅ 2 Contexts fertig
- ✅ 3 Core Hooks fertig
- ✅ Tests für Hooks (optional)

---

### Tag 5: Shared Layer - Services

**Ziel**: API-Layer abstrahieren

#### Tasks:

**Services erstellen**:
- [ ] `src/shared/services/api/wordpressApi.js`
  - Klasse mit allen API-Methoden
  - Error handling
  - Request/response interceptors
- [ ] `src/shared/services/api/geminiApi.js`
  - Aus `src/services/gemini.js` migrieren
  - Prompts zentralisieren
- [ ] `src/shared/services/api/elevenlabsApi.js`
  - Aus `src/services/elevenlabs.js` migrieren
  - Audio-spezifische Logik

**Service Hooks**:
- [ ] `src/shared/hooks/useWordPress.js`
  - Wrapper für wordpressApi
  - Loading/error states
- [ ] `src/shared/hooks/useSession.js`
  - Session CRUD
  - Guest vs. WP mode handling

**Deliverables**:
- ✅ 3 Service-Klassen
- ✅ 2 Service-Hooks
- ✅ Alte Services deprecated (nicht löschen)

---

## 🎯 Woche 2: Routing & Interview-Modul Migration

### Tag 1: Routing Setup

**Ziel**: Navigation-System implementieren

#### Tasks:

- [ ] `src/routes/routes.config.js` erstellen
  ```js
  export const ROUTES = {
    HOME: '/',
    MODULES: '/modules',
    INTERVIEW: '/interview',
    SITUATIONS: '/situations',
    // ...
  };
  ```
- [ ] `src/routes/AppRoutes.jsx` erstellen
  - Alle Route-Definitionen
  - Lazy loading vorbereiten
- [ ] `src/pages/HomePage.jsx` erstellen
  - Landing page / Dashboard
  - Modul-Auswahl
- [ ] `src/pages/ModuleSelectorPage.jsx`
  - Interview vs. Situations wählen
- [ ] `src/pages/NotFoundPage.jsx`
  - 404 page

**App.jsx refactoren**:
- [ ] Alte Logik auskommentieren (nicht löschen!)
- [ ] Neue Struktur:
  ```jsx
  <BrowserRouter>
    <AppProviders>
      <Header />
      <AppRoutes />
    </AppProviders>
  </BrowserRouter>
  ```

**Deliverables**:
- ✅ Routing funktioniert
- ✅ Navigation zwischen Seiten
- ✅ App.jsx < 100 Zeilen

---

### Tag 2-3: Interview-Modul - Komponenten extrahieren

**Ziel**: Bestehende Funktionalität modularisieren

#### Tasks:

**Module Root**:
- [ ] `src/modules/interview-trainer/InterviewTrainer.jsx`
  - Root component mit Sub-Routes
  - Layout für Interview-Modul

**Komponenten erstellen**:
- [ ] `InterviewSetup.jsx`
  - User Wizard integration
  - Conversation style selection
- [ ] `InterviewSession.jsx`
  - ElevenLabs integration
  - Live conversation view
  - Audio controls
- [ ] `InterviewFeedback.jsx`
  - Feedback display
  - Audio analysis
  - Export button

**Sub-Components**:
- [ ] `components/InterviewControls.jsx`
  - Start/Stop/Pause buttons
- [ ] `components/ConversationView.jsx`
  - Real-time messages (optional)
- [ ] `components/StyleSwitcher.jsx`
  - Friendly/Critical/Professional

**Deliverables**:
- ✅ Interview-Modul funktioniert wie vorher
- ✅ Code aufgeteilt in sinnvolle Komponenten
- ✅ Alte App.jsx kann gelöscht werden

---

### Tag 4: Interview-Modul - Hooks & Services

**Ziel**: Business Logic kapseln

#### Tasks:

**Hooks erstellen**:
- [ ] `hooks/useInterview.js`
  - Session state
  - Start/stop logic
- [ ] `hooks/useConversation.js`
  - ElevenLabs integration
  - Audio stream handling
- [ ] `hooks/useInterviewFeedback.js`
  - Feedback generation
  - Audio analysis

**Services**:
- [ ] `services/interviewService.js`
  - Business logic
  - Data transformation

**Deliverables**:
- ✅ Logik aus Komponenten extrahiert
- ✅ Wiederverwendbare Hooks
- ✅ Testbare Services

---

### Tag 5: Shared Components Migration

**Ziel**: Komponenten wiederverwenden

#### Tasks:

**Layout Components**:
- [ ] `src/shared/components/layout/Header.jsx`
  - Aus `src/components/Header.jsx` migrieren
  - Routing integration
- [ ] `src/shared/components/layout/PageLayout.jsx`
  - Standard page wrapper
- [ ] `src/shared/components/layout/ModuleLayout.jsx`
  - Module-specific wrapper

**User Components**:
- [ ] `src/shared/components/user/UserWizard.jsx`
  - Aus `src/components/UserWizard.jsx` migrieren
  - useUser integration
- [ ] `src/shared/components/user/UserProfile.jsx`
  - Profile display
  - Edit mode

**Feedback Components**:
- [ ] `src/shared/components/feedback/FeedbackModal.jsx`
  - Aus `src/components/FeedbackModal.jsx` migrieren
- [ ] `src/shared/components/feedback/ScoreDisplay.jsx`
  - Score visualization
- [ ] `src/shared/components/feedback/CriteriaList.jsx`
  - Criteria breakdown

**Audio Components**:
- [ ] `src/shared/components/audio/AudioRecorder.jsx`
  - Browser recording logic
- [ ] `src/shared/components/audio/AudioPlayer.jsx`
  - Playback controls

**Deliverables**:
- ✅ 8+ shared components
- ✅ Alte components/ gelöscht
- ✅ Alle Module nutzen shared components

---

## 🎯 Woche 3: Situations-Coach Modul

### Tag 1: Backend - Datenbank & API

**Ziel**: Backend-Infrastruktur

#### Tasks:

**Datenbank-Schema**:
- [ ] `includes/class-database.php` erweitern
  ```sql
  CREATE TABLE wp_situations_scenarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    difficulty TINYINT,
    intro_text TEXT,
    prompt_text TEXT,
    tags JSON,
    followup_prompts JSON,
    evaluation_rubric JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty)
  );

  CREATE TABLE wp_situations_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    scenario_id BIGINT UNSIGNED NOT NULL,
    mode ENUM('chat', 'audio') DEFAULT 'chat',
    user_answer_text TEXT,
    audio_url TEXT,
    ai_feedback JSON,
    score_overall DECIMAL(5,2),
    scores_by_criterion JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_scenario_id (scenario_id),
    FOREIGN KEY (scenario_id) REFERENCES wp_situations_scenarios(id)
  );
  ```

**REST API Endpoints**:
- [ ] `includes/class-api.php` erweitern
  - `GET /scenarios` - List scenarios (with filters)
  - `GET /scenarios/{id}` - Get scenario details
  - `POST /scenarios` - Create scenario (admin)
  - `GET /attempts` - List user attempts
  - `POST /attempts` - Create attempt
  - `GET /attempts/{id}` - Get attempt with feedback

**Gemini Service erweitern**:
- [ ] `includes/class-gemini-handler.php`
  - `evaluateScenarioAttempt()` - Scoring
  - `generateFollowUpQuestion()` - Nachfragen

**Deliverables**:
- ✅ Datenbank-Migration
- ✅ 6 API-Endpoints
- ✅ Gemini-Integration für Szenarien

---

### Tag 2: Frontend - Service Layer

**Ziel**: API-Integration im Frontend

#### Tasks:

**WordPress API erweitern**:
- [ ] `src/shared/services/api/wordpressApi.js`
  ```js
  // Scenarios
  async getScenarios(filters = {}) { ... }
  async getScenario(id) { ... }

  // Attempts
  async createAttempt(scenarioId, data) { ... }
  async getAttempt(id) { ... }
  ```

**Module Services**:
- [ ] `src/modules/situations-coach/services/scenarioService.js`
  - Business logic für Szenarien
  - Filtering, sorting
- [ ] `src/modules/situations-coach/services/scoringService.js`
  - Score calculation
  - Rubric evaluation
- [ ] `src/modules/situations-coach/services/followUpService.js`
  - Nachfragen-Logik
  - Dialog-Steuerung

**Module Hooks**:
- [ ] `src/modules/situations-coach/hooks/useScenario.js`
  - Szenario laden
  - Caching
- [ ] `src/modules/situations-coach/hooks/useAttempt.js`
  - Attempt erstellen
  - Feedback abrufen
- [ ] `src/modules/situations-coach/hooks/useScoring.js`
  - Score berechnen
  - Kriterien bewerten
- [ ] `src/modules/situations-coach/hooks/useFollowUp.js`
  - Dialog-State
  - Nachfragen-Queue

**Deliverables**:
- ✅ API-Integration komplett
- ✅ 3 Services
- ✅ 4 Custom Hooks

---

### Tag 3-4: Frontend - UI Components

**Ziel**: Situations-Coach UI

#### Tasks:

**Module Root**:
- [ ] `src/modules/situations-coach/SituationsCoach.jsx`
  - Routing setup
  - Module layout

**Szenario-Browser**:
- [ ] `components/ScenarioBrowser.jsx`
  - Grid view
  - Filters (category, difficulty)
  - Search
- [ ] `components/ScenarioCard.jsx`
  - Card display
  - Difficulty badge
  - Tags
- [ ] `components/ScenarioFilters.jsx`
  - Category dropdown
  - Difficulty slider
  - Tags filter

**Szenario-Detail**:
- [ ] `components/ScenarioDetail.jsx`
  - Full scenario view
  - Audio intro player
  - Start button

**Practice View**:
- [ ] `components/ScenarioPractice.jsx`
  - Main practice screen
  - Answer submission
- [ ] `components/AnswerInput.jsx`
  - Text mode (textarea)
  - Audio mode (recorder)
  - Submit button
- [ ] `components/AudioIntroPlayer.jsx`
  - TTS playback
  - Waveform (optional)

**Feedback View**:
- [ ] `components/ScenarioFeedback.jsx`
  - Score display
  - Criteria breakdown
  - Example answers
  - Retry button
- [ ] `components/FeedbackView.jsx`
  - Reusable feedback layout
- [ ] `components/CriteriaBreakdown.jsx`
  - Criteria list with scores

**Follow-Up Dialog**:
- [ ] `components/FollowUpDialog.jsx`
  - Modal dialog
  - Question display
  - Answer input
  - Continue button

**Progress Tracking**:
- [ ] `components/ProgressTracker.jsx`
  - User stats
  - Completed scenarios
  - Average score

**Deliverables**:
- ✅ 12+ UI Components
- ✅ Vollständiger User-Flow
- ✅ Responsive Design

---

### Tag 5: Integration & Features

**Ziel**: Features zusammenführen

#### Tasks:

**Features implementieren**:
- [ ] Audio Recording Integration
  - useAudio hook verwenden
  - Transcription
- [ ] TTS Integration
  - Intro-Audio generieren
  - ElevenLabs oder Google TTS
- [ ] Light-Dialog System
  - Follow-up questions
  - Multi-turn (max 3)
  - Gemini integration
- [ ] Progress Tracking
  - Attempts speichern
  - Statistics anzeigen

**Routing finalisieren**:
- [ ] `/situations` → Browser
- [ ] `/situations/scenario/:id` → Detail
- [ ] `/situations/practice/:id` → Practice
- [ ] `/situations/feedback/:attemptId` → Feedback

**Deliverables**:
- ✅ Audio funktioniert
- ✅ Follow-up Dialog funktioniert
- ✅ Progress wird getrackt
- ✅ Navigation flüssig

---

## 🎯 Woche 4: Testing, Refinement & Deployment

### Tag 1-2: Testing & Bug Fixes

**Ziel**: Stabilität sicherstellen

#### Tasks:

**Funktionale Tests**:
- [ ] Interview-Modul
  - [ ] Wizard flow
  - [ ] Audio recording
  - [ ] Conversation
  - [ ] Feedback generation
  - [ ] PDF export
- [ ] Situations-Modul
  - [ ] Szenario-Browser
  - [ ] Filtering
  - [ ] Szenario starten
  - [ ] Text-Antwort
  - [ ] Audio-Antwort
  - [ ] Feedback anzeigen
  - [ ] Follow-up Dialog
  - [ ] Retry
- [ ] User Management
  - [ ] Guest mode
  - [ ] WordPress login
  - [ ] User data persistence
- [ ] Routing
  - [ ] Alle Routen erreichbar
  - [ ] Back-Button funktioniert
  - [ ] Deep links funktionieren

**Browser Testing**:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**Device Testing**:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Deliverables**:
- ✅ Bug-Liste erstellt
- ✅ Kritische Bugs gefixt
- ✅ Cross-browser kompatibel

---

### Tag 3: Refinement & Optimization

**Ziel**: Polish & Performance

#### Tasks:

**Performance**:
- [ ] Lazy Loading für Module
  ```jsx
  const InterviewTrainer = lazy(() => import('@/modules/interview-trainer/InterviewTrainer'));
  ```
- [ ] Code Splitting
- [ ] Bundle Size analysieren
- [ ] Images optimieren

**UX Improvements**:
- [ ] Loading States überall
- [ ] Error States überall
- [ ] Skeleton Components
- [ ] Transitions/Animations
- [ ] Accessibility (a11y)
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Color contrast

**Code Quality**:
- [ ] ESLint durchlaufen
- [ ] Console.logs entfernen
- [ ] Kommentare aufräumen
- [ ] TODOs adressieren

**Deliverables**:
- ✅ Performance verbessert
- ✅ UX polished
- ✅ Code clean

---

### Tag 4: Dokumentation

**Ziel**: Wissen teilen

#### Tasks:

**Code-Dokumentation**:
- [ ] JSDoc für komplexe Funktionen
- [ ] README.md aktualisieren
- [ ] CLAUDE.md aktualisieren
- [ ] Component-Docs (Storybook optional)

**API-Dokumentation**:
- [ ] `docs/api/README.md`
  - Alle Endpoints dokumentieren
  - Request/Response Beispiele
  - Error Codes

**User-Guide** (optional):
- [ ] `docs/USER_GUIDE.md`
  - Wie nutze ich Interview-Trainer?
  - Wie nutze ich Situations-Coach?

**Migration-Guide**:
- [ ] `docs/MIGRATION_V1_TO_V2.md`
  - Was hat sich geändert?
  - Breaking Changes
  - Upgrade-Schritte

**Deliverables**:
- ✅ Code dokumentiert
- ✅ API dokumentiert
- ✅ README aktualisiert

---

### Tag 5: Deployment & Monitoring

**Ziel**: Production-ready

#### Tasks:

**Pre-Deployment Checklist**:
- [ ] Alle Tests grün
- [ ] Build läuft ohne Fehler
- [ ] Environment variables gesetzt
- [ ] Security Audit
  ```bash
  npm audit
  npm audit fix
  ```
- [ ] Performance Audit (Lighthouse)

**Deployment**:
- [ ] Staging Deployment
- [ ] Smoke Tests auf Staging
- [ ] Production Deployment
- [ ] Smoke Tests auf Production

**Monitoring**:
- [ ] Error Tracking (Sentry optional)
- [ ] Analytics (optional)
- [ ] Logging

**Post-Deployment**:
- [ ] User Acceptance Testing
- [ ] Feedback sammeln
- [ ] Hotfixes (falls nötig)

**Deliverables**:
- ✅ App live
- ✅ Monitoring aktiv
- ✅ Feedback-Prozess etabliert

---

## 📊 Success Metrics

### Code Quality

| Metric | Vorher | Ziel |
|--------|--------|------|
| App.jsx Zeilen | 1.243 | < 100 |
| Komponenten-Größe (Ø) | ~300 Zeilen | < 150 Zeilen |
| Code-Duplikation | Hoch | Minimal |
| Test Coverage | 0% | 60%+ (optional) |

### Performance

| Metric | Vorher | Ziel |
|--------|--------|------|
| Bundle Size | ~2MB | < 1.5MB |
| Initial Load | ~3s | < 2s |
| Time to Interactive | ~4s | < 3s |

### Developer Experience

| Metric | Vorher | Ziel |
|--------|--------|------|
| Neue Feature (Tage) | 5-7 | 2-3 |
| Bug Fix (Stunden) | 4-6 | 1-2 |
| Onboarding (Tage) | 3-5 | 1-2 |

---

## 🚨 Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|---------|------------|
| Breaking Changes im Interview-Modul | Mittel | Hoch | Parallele alte Version behalten |
| Performance-Regression | Niedrig | Mittel | Lighthouse Tests vor/nach |
| WordPress-Integration bricht | Niedrig | Hoch | Dual-Mode Strategie beibehalten |
| Zeitüberschreitung | Mittel | Mittel | MVP-Ansatz, Features priorisieren |

---

## 🎉 Definition of Done

### Refactoring Done = ✅

- [ ] Alle Module funktionieren wie vorher
- [ ] Keine Regression in bestehenden Features
- [ ] Code < 50% der ursprünglichen Komplexität
- [ ] Dokumentation vollständig
- [ ] Tests laufen (falls vorhanden)
- [ ] Production Deployment erfolgreich

### Situations-Coach MVP Done = ✅

- [ ] User kann Szenarien durchsuchen
- [ ] User kann Szenario üben (Text + Audio)
- [ ] User bekommt Gemini-Feedback
- [ ] User kann Follow-up-Fragen beantworten
- [ ] User sieht Fortschritt
- [ ] Datenbank speichert Attempts

---

## 🛠️ Tools & Resources

### Development
- VS Code + Extensions (ESLint, Prettier)
- React DevTools
- Vite DevTools
- Chrome DevTools

### Testing
- Lighthouse (Performance)
- WAVE (Accessibility)
- BrowserStack (Cross-browser, optional)

### Monitoring
- Sentry (Error tracking, optional)
- Google Analytics (optional)

---

## 📞 Support & Communication

### Daily Standup (optional)
- Was wurde gestern gemacht?
- Was wird heute gemacht?
- Gibt es Blocker?

### Wöchentliches Review
- Fortschritt checken
- Risiken identifizieren
- Scope anpassen (falls nötig)

---

**Ende Implementierungsplan**

Nächster Schritt: Start mit Woche 1, Tag 1-2! 🚀
