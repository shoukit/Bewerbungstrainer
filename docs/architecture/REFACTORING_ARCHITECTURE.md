# Bewerbungstrainer - Refactoring Architektur

**Version**: 2.0
**Datum**: 2025-11-24
**Status**: Planning Phase
**Autor**: Architecture Team

---

## 📋 Inhaltsverzeichnis

1. [Architektur-Übersicht](#architektur-übersicht)
2. [Ordnerstruktur](#ordnerstruktur)
3. [Routing-Strategie](#routing-strategie)
4. [State Management](#state-management)
5. [Component-Architektur](#component-architektur)
6. [Service Layer](#service-layer)
7. [Data Flow](#data-flow)
8. [Module System](#module-system)
9. [Code-Organisation](#code-organisation)
10. [Naming Conventions](#naming-conventions)
11. [Patterns & Best Practices](#patterns--best-practices)
12. [Migration Guide](#migration-guide)

---

## 🎯 Architektur-Übersicht

### Aktuelle Probleme (v1.x)

| Problem | Impact | Lösung in v2.0 |
|---------|--------|----------------|
| Monolithische App.jsx (1.243 Zeilen) | Wartungsalbtraum | Modularisierung nach Features |
| Kein Routing | Kann nicht skalieren | React Router v6 |
| useState überall | State-Chaos | Context API + Custom Hooks |
| Keine klare Trennung | Code-Duplikation | Shared vs. Module-specific |
| Services vermischt mit UI | Testing unmöglich | Service Layer Pattern |

### Architektur-Prinzipien v2.0

1. **Feature-basierte Modularität**: Jedes Modul ist eigenständig
2. **Separation of Concerns**: UI ≠ Business Logic ≠ Data Layer
3. **Composition over Inheritance**: Kleine, wiederverwendbare Komponenten
4. **Single Source of Truth**: Zentrales State Management
5. **Dependency Injection**: Services als props/context
6. **Progressive Enhancement**: Funktioniert auch ohne JS (wo möglich)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Interview  │  │  Situations  │  │   Profile    │  │
│  │   Trainer    │  │    Coach     │  │   & Stats    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│              Shared Components & Hooks                   │
│  - UserContext  - AudioRecorder  - FeedbackModal        │
│  - SessionManager  - Header  - Wizard                   │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
│  - Gemini  - ElevenLabs  - WordPress API  - Audio       │
├─────────────────────────────────────────────────────────┤
│                   External Services                      │
│  - WordPress Backend  - Gemini API  - ElevenLabs API    │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Ordnerstruktur

### Vollständige Struktur

```
Bewerbungstrainer/
├── src/
│   ├── main.jsx                    # App entry point
│   ├── App.jsx                     # Root component (nur Routing + Layout)
│   ├── index.css                   # Global styles
│   │
│   ├── modules/                    # ⭐ Feature Modules
│   │   │
│   │   ├── interview-trainer/      # Bestehendes Interview-Modul
│   │   │   ├── InterviewTrainer.jsx           # Module root component
│   │   │   ├── components/
│   │   │   │   ├── InterviewControls.jsx
│   │   │   │   ├── ConversationView.jsx
│   │   │   │   ├── AudioPlayer.jsx
│   │   │   │   └── StyleSwitcher.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useInterview.js            # Interview state logic
│   │   │   │   ├── useConversation.js         # ElevenLabs integration
│   │   │   │   └── useInterviewFeedback.js    # Feedback generation
│   │   │   ├── services/
│   │   │   │   └── interviewService.js        # Business logic
│   │   │   └── constants.js                   # Module-specific constants
│   │   │
│   │   └── situations-coach/       # ⭐ NEUES Situations-Modul
│   │       ├── SituationsCoach.jsx            # Module root component
│   │       ├── components/
│   │       │   ├── ScenarioBrowser.jsx        # Szenario-Übersicht
│   │       │   ├── ScenarioCard.jsx           # Einzelnes Szenario
│   │       │   ├── ScenarioPlayer.jsx         # Szenario-Durchführung
│   │       │   ├── AnswerInput.jsx            # Text/Audio Input
│   │       │   ├── FeedbackView.jsx           # Feedback-Anzeige
│   │       │   ├── FollowUpDialog.jsx         # Nachfragen-Dialog
│   │       │   └── ProgressTracker.jsx        # Fortschritts-Anzeige
│   │       ├── hooks/
│   │       │   ├── useScenario.js             # Szenario-Verwaltung
│   │       │   ├── useAttempt.js              # Versuchs-Tracking
│   │       │   ├── useScoring.js              # Bewertungs-Logik
│   │       │   └── useFollowUp.js             # Nachfragen-Management
│   │       ├── services/
│   │       │   ├── scenarioService.js         # Szenario CRUD
│   │       │   ├── scoringService.js          # Bewertungs-Engine
│   │       │   └── followUpService.js         # Nachfragen-Generator
│   │       └── constants.js                   # Kategorien, Schwierigkeiten
│   │
│   ├── shared/                     # ⭐ Geteilte Ressourcen
│   │   │
│   │   ├── components/             # Wiederverwendbare UI-Komponenten
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── PageLayout.jsx
│   │   │   │   └── ModuleLayout.jsx
│   │   │   ├── feedback/
│   │   │   │   ├── FeedbackModal.jsx
│   │   │   │   ├── FeedbackCard.jsx
│   │   │   │   ├── ScoreDisplay.jsx
│   │   │   │   └── CriteriaList.jsx
│   │   │   ├── audio/
│   │   │   │   ├── AudioRecorder.jsx
│   │   │   │   ├── AudioPlayer.jsx
│   │   │   │   ├── WaveformVisualizer.jsx
│   │   │   │   └── RecordButton.jsx
│   │   │   ├── user/
│   │   │   │   ├── UserWizard.jsx
│   │   │   │   ├── UserProfile.jsx
│   │   │   │   └── UserAvatar.jsx
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   │   ├── button.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   ├── badge.jsx
│   │   │   │   ├── select.jsx
│   │   │   │   └── input.jsx
│   │   │   └── common/
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── ErrorBoundary.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       └── ConfirmDialog.jsx
│   │   │
│   │   ├── hooks/                  # Geteilte Custom Hooks
│   │   │   ├── useUser.js          # User state & auth
│   │   │   ├── useSession.js       # Session management
│   │   │   ├── useAudio.js         # Audio recording/playback
│   │   │   ├── useFeedback.js      # Feedback generation
│   │   │   ├── useWordPress.js     # WordPress API integration
│   │   │   ├── useLocalStorage.js  # Persistent local state
│   │   │   └── useDebounce.js      # Utility hooks
│   │   │
│   │   ├── contexts/               # React Context Providers
│   │   │   ├── UserContext.jsx     # User data & authentication
│   │   │   ├── AppConfigContext.jsx # App configuration
│   │   │   ├── ThemeContext.jsx    # Theme/styling (future)
│   │   │   └── index.js            # Combined provider export
│   │   │
│   │   ├── services/               # Business Logic Layer
│   │   │   ├── api/
│   │   │   │   ├── wordpressApi.js     # WordPress REST API client
│   │   │   │   ├── geminiApi.js        # Gemini API wrapper
│   │   │   │   └── elevenlabsApi.js    # ElevenLabs API wrapper
│   │   │   ├── audio/
│   │   │   │   ├── audioHandler.js     # Audio file management
│   │   │   │   ├── recorder.js         # Browser audio recording
│   │   │   │   └── transcription.js    # Audio-to-text
│   │   │   ├── feedback/
│   │   │   │   ├── feedbackGenerator.js # Gemini feedback
│   │   │   │   └── audioAnalyzer.js     # Audio quality analysis
│   │   │   └── storage/
│   │   │       ├── localStorageService.js
│   │   │       └── sessionStorage.js
│   │   │
│   │   ├── utils/                  # Utility Functions
│   │   │   ├── cn.js               # Tailwind class merger
│   │   │   ├── formatters.js       # Date, time, number formatting
│   │   │   ├── validators.js       # Input validation
│   │   │   ├── errors.js           # Error handling helpers
│   │   │   └── constants.js        # Global constants
│   │   │
│   │   └── types/                  # TypeScript types (future)
│   │       ├── user.types.js
│   │       ├── session.types.js
│   │       └── feedback.types.js
│   │
│   ├── routes/                     # Routing Configuration
│   │   ├── AppRoutes.jsx           # Main route definitions
│   │   ├── ProtectedRoute.jsx      # Auth guard
│   │   └── routes.config.js        # Route constants
│   │
│   └── pages/                      # Top-level Pages
│       ├── HomePage.jsx            # Landing/Dashboard
│       ├── ModuleSelectorPage.jsx  # Modul-Auswahl
│       ├── ProfilePage.jsx         # User profile
│       ├── HistoryPage.jsx         # Session history
│       └── NotFoundPage.jsx        # 404
│
├── public/                         # Static assets
│   ├── audio/                      # Pre-recorded audio files
│   ├── images/                     # Icons, logos
│   └── favicon.ico
│
├── docs/                           # Documentation
│   ├── architecture/               # This folder
│   ├── api/                        # API documentation
│   └── components/                 # Component docs
│
├── tests/                          # Test files (future)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── [config files]                  # package.json, vite.config.js, etc.
```

### Ordner-Prinzipien

| Ordner | Zweck | Regel |
|--------|-------|-------|
| `/modules` | Feature-spezifischer Code | Nur von diesem Modul verwendet |
| `/shared` | Wiederverwendbarer Code | Von ≥2 Modulen genutzt |
| `/routes` | Routing-Konfiguration | Zentrale Navigation |
| `/pages` | Top-level Seiten | Routen-Components |

---

## 🛣️ Routing-Strategie

### Route-Hierarchie

```jsx
// src/routes/routes.config.js
export const ROUTES = {
  HOME: '/',
  MODULES: '/modules',

  // Interview Trainer Module
  INTERVIEW: '/interview',
  INTERVIEW_SETUP: '/interview/setup',
  INTERVIEW_SESSION: '/interview/session/:sessionId',
  INTERVIEW_FEEDBACK: '/interview/feedback/:sessionId',

  // Situations Coach Module
  SITUATIONS: '/situations',
  SITUATIONS_BROWSE: '/situations/browse',
  SITUATIONS_SCENARIO: '/situations/scenario/:scenarioId',
  SITUATIONS_PRACTICE: '/situations/practice/:scenarioId',
  SITUATIONS_FEEDBACK: '/situations/feedback/:attemptId',

  // User Pages
  PROFILE: '/profile',
  HISTORY: '/history',
  SETTINGS: '/settings',

  // Special
  WIZARD: '/wizard',
  NOT_FOUND: '*'
};
```

### Route-Struktur Implementierung

```jsx
// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './routes.config';

// Pages
import HomePage from '@/pages/HomePage';
import ModuleSelectorPage from '@/pages/ModuleSelectorPage';
import ProfilePage from '@/pages/ProfilePage';
import HistoryPage from '@/pages/HistoryPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Modules
import InterviewTrainer from '@/modules/interview-trainer/InterviewTrainer';
import SituationsCoach from '@/modules/situations-coach/SituationsCoach';

// Shared
import UserWizard from '@/shared/components/user/UserWizard';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Home & Core Pages */}
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.MODULES} element={<ModuleSelectorPage />} />
      <Route path={ROUTES.WIZARD} element={<UserWizard />} />

      {/* Interview Module Routes */}
      <Route path={ROUTES.INTERVIEW} element={<InterviewTrainer />}>
        <Route index element={<InterviewSetup />} />
        <Route path="setup" element={<InterviewSetup />} />
        <Route path="session/:sessionId" element={<InterviewSession />} />
        <Route path="feedback/:sessionId" element={<InterviewFeedback />} />
      </Route>

      {/* Situations Module Routes */}
      <Route path={ROUTES.SITUATIONS} element={<SituationsCoach />}>
        <Route index element={<Navigate to="browse" replace />} />
        <Route path="browse" element={<ScenarioBrowser />} />
        <Route path="scenario/:scenarioId" element={<ScenarioDetail />} />
        <Route path="practice/:scenarioId" element={<ScenarioPractice />} />
        <Route path="feedback/:attemptId" element={<ScenarioFeedback />} />
      </Route>

      {/* User Pages */}
      <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      <Route path={ROUTES.HISTORY} element={<HistoryPage />} />

      {/* 404 */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
}
```

### Navigation-Komponente

```jsx
// src/shared/components/layout/Navigation.jsx
import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: ROUTES.HOME, label: 'Dashboard', icon: 'Home' },
    { path: ROUTES.INTERVIEW, label: 'Interview-Trainer', icon: 'Mic' },
    { path: ROUTES.SITUATIONS, label: 'Situations-Coach', icon: 'MessageCircle' },
    { path: ROUTES.HISTORY, label: 'Verlauf', icon: 'History' },
    { path: ROUTES.PROFILE, label: 'Profil', icon: 'User' }
  ];

  return (
    <nav className="flex gap-4">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "nav-link",
            location.pathname.startsWith(item.path) && "active"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

---

## 🗄️ State Management

### Strategie: Hybrid Approach

Wir nutzen eine Kombination aus:

1. **React Context API** → Global State (User, Config)
2. **Custom Hooks** → Feature-spezifische State Logic
3. **URL State** → Navigation & Deep Links
4. **Local Storage** → Persistenz (Guest Mode)

### User Context

```jsx
// src/shared/contexts/UserContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useWordPress } from '@/shared/hooks/useWordPress';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { fetchUserInfo } = useWordPress();
  const [storedUser, setStoredUser] = useLocalStorage('bewerbungstrainer_user_data', null);

  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initUser() {
      try {
        // Try WordPress user first
        const wpUser = await fetchUserInfo();
        if (wpUser) {
          setUser(wpUser);
          setIsGuest(false);
        } else {
          // Fallback to localStorage (guest mode)
          setUser(storedUser);
          setIsGuest(true);
        }
      } catch (error) {
        console.error('User init failed:', error);
        setUser(storedUser);
        setIsGuest(true);
      } finally {
        setIsLoading(false);
      }
    }

    initUser();
  }, []);

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    if (isGuest) {
      setStoredUser(updatedUser);
    }
  };

  const clearUser = () => {
    setUser(null);
    setStoredUser(null);
  };

  return (
    <UserContext.Provider value={{
      user,
      isGuest,
      isLoading,
      updateUser,
      clearUser
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

### App Config Context

```jsx
// src/shared/contexts/AppConfigContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AppConfigContext = createContext(null);

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState({
    isWordPressMode: false,
    apiKeys: {
      gemini: import.meta.env.VITE_GEMINI_API_KEY,
      elevenlabs: import.meta.env.VITE_ELEVENLABS_API_KEY
    },
    features: {
      audioRecording: true,
      videoRecording: false,
      pdfExport: true
    }
  });

  useEffect(() => {
    // Detect if running in WordPress
    const isWP = window.bewerbungstrainerData !== undefined;
    setConfig(prev => ({ ...prev, isWordPressMode: isWP }));

    if (isWP) {
      // Override with WordPress config
      setConfig(prev => ({
        ...prev,
        apiKeys: {
          gemini: window.bewerbungstrainerData.geminiApiKey,
          elevenlabs: window.bewerbungstrainerData.elevenlabsApiKey
        }
      }));
    }
  }, []);

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}
```

### Combined Provider

```jsx
// src/shared/contexts/index.js
import { UserProvider } from './UserContext';
import { AppConfigProvider } from './AppConfigContext';

export function AppProviders({ children }) {
  return (
    <AppConfigProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </AppConfigProvider>
  );
}

export { useUser } from './UserContext';
export { useAppConfig } from './AppConfigContext';
```

### Custom Hook Pattern: useSession

```jsx
// src/shared/hooks/useSession.js
import { useState, useCallback } from 'react';
import { useUser } from '@/shared/contexts/UserContext';
import { useWordPress } from '@/shared/hooks/useWordPress';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';

export function useSession(moduleType = 'interview') {
  const { user, isGuest } = useUser();
  const { createSession, updateSession, fetchSession } = useWordPress();
  const [localSessions, setLocalSessions] = useLocalStorage(`${moduleType}_sessions`, []);

  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (sessionData) => {
    setIsLoading(true);
    setError(null);

    try {
      let session;

      if (isGuest) {
        // Local storage mode
        session = {
          id: `local-${Date.now()}`,
          ...sessionData,
          userId: 'guest',
          createdAt: new Date().toISOString()
        };
        setLocalSessions(prev => [...prev, session]);
      } else {
        // WordPress mode
        session = await createSession(moduleType, sessionData);
      }

      setCurrentSession(session);
      return session;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, moduleType, createSession, setLocalSessions]);

  const update = useCallback(async (sessionId, updates) => {
    setIsLoading(true);
    setError(null);

    try {
      let updatedSession;

      if (isGuest) {
        setLocalSessions(prev =>
          prev.map(s => s.id === sessionId ? { ...s, ...updates } : s)
        );
        updatedSession = { ...currentSession, ...updates };
      } else {
        updatedSession = await updateSession(sessionId, updates);
      }

      setCurrentSession(updatedSession);
      return updatedSession;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, currentSession, updateSession, setLocalSessions]);

  const load = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      let session;

      if (isGuest) {
        session = localSessions.find(s => s.id === sessionId);
      } else {
        session = await fetchSession(sessionId);
      }

      setCurrentSession(session);
      return session;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, localSessions, fetchSession]);

  return {
    currentSession,
    isLoading,
    error,
    create,
    update,
    load
  };
}
```

---

## 🧩 Component-Architektur

### Component-Typen

| Typ | Zweck | Beispiel | Hat State? | Hat Business Logic? |
|-----|-------|----------|------------|---------------------|
| **Page** | Top-level Route | `HomePage.jsx` | Nein | Nein |
| **Module** | Feature Root | `InterviewTrainer.jsx` | Ja | Ja (via Hooks) |
| **Container** | Data Fetching | `ScenarioBrowser.jsx` | Ja | Ja |
| **Presentational** | Pure UI | `ScenarioCard.jsx` | Nein | Nein |
| **Layout** | Structure | `PageLayout.jsx` | Nein | Nein |

### Component Pattern: Presentational vs Container

#### ❌ Altes Pattern (vermischt)

```jsx
// Bad: UI + Logic zusammen
function ScenarioCard({ scenarioId }) {
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenario(scenarioId).then(setScenario);
  }, [scenarioId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <h3>{scenario.title}</h3>
      <p>{scenario.description}</p>
    </div>
  );
}
```

#### ✅ Neues Pattern (getrennt)

```jsx
// Container: Data Fetching
function ScenarioCardContainer({ scenarioId }) {
  const { scenario, isLoading } = useScenario(scenarioId);

  if (isLoading) return <ScenarioCardSkeleton />;
  if (!scenario) return <EmptyState />;

  return <ScenarioCard scenario={scenario} />;
}

// Presentational: Pure UI
function ScenarioCard({ scenario }) {
  return (
    <div className="card">
      <h3>{scenario.title}</h3>
      <p>{scenario.description}</p>
      <Badge>{scenario.difficulty}</Badge>
    </div>
  );
}
```

### Component Composition

```jsx
// Kleine, wiederverwendbare Komponenten
function ScenarioBrowser() {
  return (
    <div className="scenario-browser">
      <ScenarioFilters />
      <ScenarioGrid>
        {scenarios.map(s => (
          <ScenarioCardContainer key={s.id} scenarioId={s.id} />
        ))}
      </ScenarioGrid>
      <Pagination />
    </div>
  );
}
```

### Prop Drilling vermeiden

```jsx
// ❌ Bad: Prop Drilling
function App() {
  const [user, setUser] = useState(null);
  return <PageLayout user={user}>
    <Module user={user}>
      <Component user={user} />
    </Module>
  </PageLayout>;
}

// ✅ Good: Context
function Component() {
  const { user } = useUser(); // Direct access
  return <div>{user.name}</div>;
}
```

---

## 🔧 Service Layer

### Service-Architektur

Services kapseln Business Logic und externe API-Calls.

```jsx
// src/shared/services/api/wordpressApi.js
class WordPressApiService {
  constructor(baseUrl = '/wp-json/bewerbungstrainer/v1') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('WordPress API Error:', error);
      throw error;
    }
  }

  // Sessions
  async createSession(type, data) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ type, ...data })
    });
  }

  async getSession(id) {
    return this.request(`/sessions/${id}`);
  }

  async updateSession(id, data) {
    return this.request(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Scenarios (für Situations-Coach)
  async getScenarios(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/scenarios?${params}`);
  }

  async getScenario(id) {
    return this.request(`/scenarios/${id}`);
  }

  // Attempts
  async createAttempt(scenarioId, data) {
    return this.request('/attempts', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId, ...data })
    });
  }
}

export default new WordPressApiService();
```

### Service Hook Pattern

```jsx
// src/shared/hooks/useWordPress.js
import { useState, useCallback } from 'react';
import wordpressApi from '@/shared/services/api/wordpressApi';

export function useWordPress() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSession = useCallback(async (type, data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await wordpressApi.createSession(type, data);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ... weitere Methoden

  return {
    isLoading,
    error,
    createSession,
    updateSession,
    fetchSession,
    // ... etc
  };
}
```

---

## 🔄 Data Flow

### Unidirectional Data Flow

```
┌──────────────┐
│  User Action │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Event       │
│  Handler     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Custom Hook │
│  (Business   │
│   Logic)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Service     │
│  (API Call)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  State       │
│  Update      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Re-render   │
└──────────────┘
```

### Beispiel: Szenario starten

```jsx
// 1. User Action
<Button onClick={handleStartScenario}>Szenario starten</Button>

// 2. Event Handler
function handleStartScenario() {
  startPractice(scenarioId);
}

// 3. Custom Hook (Business Logic)
function useScenarioPractice(scenarioId) {
  const { create } = useSession('situations');
  const { scenario } = useScenario(scenarioId);

  const startPractice = async () => {
    const attempt = await create({
      scenario_id: scenarioId,
      mode: 'audio'
    });
    navigate(`/situations/practice/${scenarioId}`);
  };

  return { startPractice };
}

// 4. Service (API Call)
// useSession → wordpressApi.createSession()

// 5. State Update
// setCurrentSession(newSession)

// 6. Re-render mit neuen Daten
```

---

## 📦 Module System

### Module-Struktur

Jedes Modul ist eine eigenständige Feature-Einheit:

```
modules/situations-coach/
├── SituationsCoach.jsx         # Module Root (Routing)
├── components/                 # Module-specific UI
├── hooks/                      # Module-specific logic
├── services/                   # Module-specific business logic
└── constants.js                # Module-specific constants
```

### Module Root Component

```jsx
// src/modules/situations-coach/SituationsCoach.jsx
import { Routes, Route } from 'react-router-dom';
import ModuleLayout from '@/shared/components/layout/ModuleLayout';

// Module pages
import ScenarioBrowser from './components/ScenarioBrowser';
import ScenarioDetail from './components/ScenarioDetail';
import ScenarioPractice from './components/ScenarioPractice';
import ScenarioFeedback from './components/ScenarioFeedback';

export default function SituationsCoach() {
  return (
    <ModuleLayout title="Situations-Coach">
      <Routes>
        <Route index element={<ScenarioBrowser />} />
        <Route path="browse" element={<ScenarioBrowser />} />
        <Route path="scenario/:scenarioId" element={<ScenarioDetail />} />
        <Route path="practice/:scenarioId" element={<ScenarioPractice />} />
        <Route path="feedback/:attemptId" element={<ScenarioFeedback />} />
      </Routes>
    </ModuleLayout>
  );
}
```

### Inter-Module Communication

Module kommunizieren NUR über:
1. **Shared Context** (UserContext)
2. **URL Parameters** (React Router)
3. **Shared Services** (WordPress API, Gemini)

❌ **NICHT**: Direkte Imports zwischen Modulen

```jsx
// ❌ Bad
import { useInterview } from '@/modules/interview-trainer/hooks/useInterview';

// ✅ Good
import { useSession } from '@/shared/hooks/useSession';
const { currentSession } = useSession('interview');
```

---

## 📝 Code-Organisation

### Import-Reihenfolge

```jsx
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// 2. Shared (aliased imports @/)
import { useUser } from '@/shared/contexts/UserContext';
import { useSession } from '@/shared/hooks/useSession';
import Button from '@/shared/components/ui/button';

// 3. Module-specific (relative imports)
import { useScenario } from './hooks/useScenario';
import ScenarioCard from './components/ScenarioCard';
import { DIFFICULTY_LEVELS } from './constants';

// 4. Styles
import './styles.css';
```

### File Naming

| Typ | Pattern | Beispiel |
|-----|---------|----------|
| Components | PascalCase | `ScenarioCard.jsx` |
| Hooks | camelCase with `use` | `useScenario.js` |
| Services | camelCase | `scenarioService.js` |
| Utils | camelCase | `formatters.js` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS.js` |
| Types | PascalCase + `.types` | `Scenario.types.js` |

### Component File Structure

```jsx
// ScenarioCard.jsx

// 1. Imports
import { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { DIFFICULTY_COLORS } from '../constants';

// 2. Types/PropTypes (future)
/**
 * @typedef {Object} ScenarioCardProps
 * @property {Object} scenario
 * @property {Function} onSelect
 */

// 3. Constants
const DEFAULT_IMAGE = '/images/scenario-default.jpg';

// 4. Helper functions
function getDifficultyColor(difficulty) {
  return DIFFICULTY_COLORS[difficulty] || 'gray';
}

// 5. Component
export default function ScenarioCard({ scenario, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="scenario-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(scenario.id)}
    >
      <img src={scenario.image || DEFAULT_IMAGE} alt={scenario.title} />
      <h3>{scenario.title}</h3>
      <p>{scenario.description}</p>
      <Badge color={getDifficultyColor(scenario.difficulty)}>
        {scenario.difficulty}
      </Badge>
    </div>
  );
}

// 6. Sub-components (if small)
function ScenarioCardSkeleton() {
  return <div className="scenario-card skeleton" />;
}

export { ScenarioCardSkeleton };
```

---

## 🎨 Naming Conventions

### Variable Naming

```jsx
// Boolean: is/has/should prefix
const isLoading = true;
const hasError = false;
const shouldAutoplay = true;

// Arrays: plural
const scenarios = [];
const attempts = [];

// Functions: verb prefix
function handleClick() {}
function fetchScenarios() {}
function calculateScore() {}

// Event handlers: handle prefix
function handleSubmit() {}
function handleScenarioSelect() {}

// Async functions: clear naming
async function createAttempt() {}
async function loadScenario() {}
```

### Component Naming

```jsx
// Layout components: ...Layout suffix
<PageLayout />
<ModuleLayout />

// Container components: ...Container suffix
<ScenarioCardContainer />

// Modal/Dialog: Modal/Dialog suffix
<FeedbackModal />
<ConfirmDialog />

// Provider: ...Provider suffix
<UserProvider />
<AppConfigProvider />

// Form components: ...Form suffix
<AnswerForm />
<LoginForm />

// List/Grid components: ...List/Grid suffix
<ScenarioGrid />
<AttemptList />
```

### Hook Naming

```jsx
// Always start with "use"
useScenario()
useAttempt()
useAudio()

// Return object with clear names
const { scenario, isLoading, error, reload } = useScenario(id);

// Not: data, loading, err, refetch
```

### Konstanten

```jsx
// src/modules/situations-coach/constants.js

export const DIFFICULTY_LEVELS = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
  MASTER: 5
};

export const SCENARIO_CATEGORIES = {
  APPLICATION: 'application',
  DAILY_WORK: 'daily_work',
  CUSTOMER: 'customer',
  LEADERSHIP: 'leadership'
};

export const ANSWER_MODES = {
  TEXT: 'text',
  AUDIO: 'audio'
};

export const MAX_FOLLOWUP_QUESTIONS = 3;
```

---

## ✨ Patterns & Best Practices

### 1. Custom Hook Pattern

```jsx
// Kapselt komplexe State-Logik
function useScenario(scenarioId) {
  const [scenario, setScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await scenarioService.get(scenarioId);
        setScenario(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (scenarioId) load();
  }, [scenarioId]);

  const reload = useCallback(() => {
    setIsLoading(true);
    // ... reload logic
  }, [scenarioId]);

  return { scenario, isLoading, error, reload };
}
```

### 2. Compound Components

```jsx
// Flexible, wiederverwendbare Komponenten
function FeedbackView({ children }) {
  return <div className="feedback-view">{children}</div>;
}

FeedbackView.Header = function Header({ title, score }) {
  return (
    <div className="feedback-header">
      <h2>{title}</h2>
      <ScoreDisplay value={score} />
    </div>
  );
};

FeedbackView.Criteria = function Criteria({ items }) {
  return (
    <div className="criteria-list">
      {items.map(item => <CriteriaItem key={item.id} {...item} />)}
    </div>
  );
};

// Usage
<FeedbackView>
  <FeedbackView.Header title="Dein Ergebnis" score={78} />
  <FeedbackView.Criteria items={criteria} />
</FeedbackView>
```

### 3. Render Props

```jsx
// Flexible Logic-Sharing
function AudioRecorder({ children }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const start = () => { /* ... */ };
  const stop = () => { /* ... */ };

  return children({
    isRecording,
    audioBlob,
    start,
    stop
  });
}

// Usage
<AudioRecorder>
  {({ isRecording, start, stop }) => (
    <Button onClick={isRecording ? stop : start}>
      {isRecording ? 'Stop' : 'Record'}
    </Button>
  )}
</AudioRecorder>
```

### 4. Error Boundaries

```jsx
// src/shared/components/common/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state">
          <h2>Etwas ist schiefgelaufen</h2>
          <Button onClick={() => this.setState({ hasError: false })}>
            Erneut versuchen
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 5. Loading States

```jsx
// Skeleton Components für bessere UX
function ScenarioBrowser() {
  const { scenarios, isLoading } = useScenarios();

  if (isLoading) {
    return (
      <div className="scenario-grid">
        {[...Array(6)].map((_, i) => (
          <ScenarioCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="scenario-grid">
      {scenarios.map(s => <ScenarioCard key={s.id} scenario={s} />)}
    </div>
  );
}
```

### 6. Optimistic Updates

```jsx
function useAttempt() {
  const [attempts, setAttempts] = useState([]);

  const submitAnswer = async (scenarioId, answer) => {
    // Optimistic UI update
    const tempAttempt = {
      id: `temp-${Date.now()}`,
      scenarioId,
      answer,
      isPending: true
    };

    setAttempts(prev => [...prev, tempAttempt]);

    try {
      const result = await attemptService.create(scenarioId, answer);

      // Replace temp with real data
      setAttempts(prev =>
        prev.map(a => a.id === tempAttempt.id ? result : a)
      );
    } catch (error) {
      // Rollback on error
      setAttempts(prev => prev.filter(a => a.id !== tempAttempt.id));
      throw error;
    }
  };

  return { attempts, submitAnswer };
}
```

---

## 🚀 Migration Guide

### Phase 1: Setup & Infrastructure (Woche 1)

#### 1.1 Dependencies installieren

```bash
npm install react-router-dom@6
```

#### 1.2 Ordnerstruktur anlegen

```bash
mkdir -p src/{modules,shared,routes,pages}
mkdir -p src/shared/{components,hooks,contexts,services,utils}
mkdir -p src/modules/{interview-trainer,situations-coach}
```

#### 1.3 Path Aliases konfigurieren

```js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Phase 2: Shared Layer (Woche 1-2)

#### 2.1 Contexts erstellen

- [ ] UserContext
- [ ] AppConfigContext
- [ ] Combined Provider

#### 2.2 Services extrahieren

- [ ] `wordpressApi.js` (aus bestehenden API-Calls)
- [ ] `geminiApi.js` (aus `src/services/gemini.js`)
- [ ] `elevenlabsApi.js` (aus `src/services/elevenlabs.js`)

#### 2.3 Custom Hooks erstellen

- [ ] `useUser.js`
- [ ] `useSession.js`
- [ ] `useAudio.js`
- [ ] `useFeedback.js`
- [ ] `useWordPress.js`

#### 2.4 Shared Components

- [ ] Header (move from `src/components/Header.jsx`)
- [ ] UserWizard (move from `src/components/UserWizard.jsx`)
- [ ] FeedbackModal (move from `src/components/FeedbackModal.jsx`)
- [ ] UI components (button, dialog, etc.)

### Phase 3: Routing Setup (Woche 2)

#### 3.1 Routing-Konfiguration

```jsx
// src/routes/routes.config.js erstellen
// src/routes/AppRoutes.jsx erstellen
```

#### 3.2 App.jsx refactoren

```jsx
// Alt: 1.243 Zeilen
// Neu: ~50 Zeilen (nur Layout + Routing)

import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/shared/contexts';
import AppRoutes from '@/routes/AppRoutes';
import Header from '@/shared/components/layout/Header';

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <div className="app">
          <Header />
          <main>
            <AppRoutes />
          </main>
        </div>
      </AppProviders>
    </BrowserRouter>
  );
}
```

### Phase 4: Interview-Modul extrahieren (Woche 2-3)

#### 4.1 Logik aus App.jsx extrahieren

```jsx
// Alte App.jsx Logik → src/modules/interview-trainer/InterviewTrainer.jsx
// State → useInterview hook
// ElevenLabs Logic → useConversation hook
// Feedback → useInterviewFeedback hook
```

#### 4.2 Komponenten aufbrechen

- [ ] InterviewSetup
- [ ] InterviewSession
- [ ] InterviewControls
- [ ] ConversationView
- [ ] InterviewFeedback

### Phase 5: Situations-Coach Modul (Woche 3-4)

#### 5.1 Datenbank-Schema erweitern

```sql
-- WordPress Plugin: Add migrations
CREATE TABLE wp_situations_scenarios (...);
CREATE TABLE wp_situations_attempts (...);
```

#### 5.2 Backend-Endpoints

```php
// includes/class-api.php erweitern
add_route('scenarios');
add_route('attempts');
```

#### 5.3 Frontend-Komponenten

- [ ] SituationsCoach (root)
- [ ] ScenarioBrowser
- [ ] ScenarioCard
- [ ] ScenarioPlayer
- [ ] AnswerInput
- [ ] FeedbackView

### Phase 6: Testing & Refinement (Woche 4)

- [ ] Alle Routen testen
- [ ] Guest Mode testen
- [ ] WordPress Mode testen
- [ ] Audio Recording testen
- [ ] Error States testen
- [ ] Mobile Responsiveness

### Migration Checklist

```markdown
## Refactoring Checklist

### Infrastructure
- [ ] React Router installiert
- [ ] Path Aliases konfiguriert (@/)
- [ ] Ordnerstruktur angelegt
- [ ] Contexts erstellt
- [ ] Shared Hooks erstellt

### Code Migration
- [ ] App.jsx auf <100 Zeilen reduziert
- [ ] Header → shared/components/layout
- [ ] UserWizard → shared/components/user
- [ ] FeedbackModal → shared/components/feedback
- [ ] Services extrahiert
- [ ] Interview-Modul erstellt
- [ ] Situations-Modul erstellt

### Testing
- [ ] Alle Routen funktionieren
- [ ] Guest Mode funktioniert
- [ ] WordPress Mode funktioniert
- [ ] Audio funktioniert
- [ ] Feedback funktioniert
- [ ] Mobile optimiert

### Cleanup
- [ ] Alte Dateien gelöscht
- [ ] Console.logs entfernt
- [ ] Kommentare aktualisiert
- [ ] README aktualisiert
```

---

## 🎯 Nächste Schritte

### Sofort (heute/morgen):

1. **Review dieser Architektur** → Feedback & Anpassungen
2. **Ordnerstruktur anlegen** → mkdir-Befehle ausführen
3. **React Router installieren** → `npm install react-router-dom@6`

### Kurzfristig (diese Woche):

4. **Contexts erstellen** → UserContext, AppConfigContext
5. **Routing Setup** → AppRoutes.jsx
6. **App.jsx refactoren** → Logik extrahieren

### Mittelfristig (nächste 2 Wochen):

7. **Interview-Modul extrahieren**
8. **Shared Components organisieren**
9. **Custom Hooks erstellen**

### Langfristig (3-4 Wochen):

10. **Situations-Coach implementieren**
11. **Testing**
12. **Deployment**

---

## 📚 Ressourcen

### Dokumentation
- React Router: https://reactrouter.com/
- React Patterns: https://reactpatterns.com/
- Component Composition: https://react.dev/learn/passing-props-to-a-component

### Tools
- ESLint React Hooks Plugin
- React DevTools
- Vite Bundle Analyzer

---

**Ende der Architektur-Dokumentation**

Bei Fragen oder Unklarheiten → Dokumentation erweitern!
