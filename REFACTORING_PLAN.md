# Refactoring-Plan für Bewerbungstrainer

**Erstellt:** 15.12.2025
**Geschätzte Gesamtzeit:** ~25-30 Stunden
**Erwartete Code-Reduktion:** ~30% (2.000+ Zeilen)

---

## Übersicht

Nach umfassender Analyse wurden folgende Hauptbereiche für Refactoring identifiziert:

| Bereich | Priorität | Aufwand | Impact |
|---------|-----------|---------|--------|
| Shared UI Components | Hoch | 6h | Hohe Wiederverwendbarkeit |
| Custom Hooks | Hoch | 4h | Code-Reduktion in allen Komponenten |
| Utility Functions | Mittel | 3h | Konsistenz & DRY |
| PHP Base Classes | Mittel | 5h | Backend-Wartbarkeit |
| Service Layer | Niedrig | 4h | Error Handling Konsistenz |
| Konfiguration | Niedrig | 2h | Übersichtlichkeit |

---

## Phase 1: Quick Wins (1 Tag)

### 1.1 Shared Colors Konstanten
**Aufwand:** 1 Stunde
**Betroffene Dateien:** 5+ Komponenten

**Problem:** Identische COLORS-Objekte in mehreren Dateien:
- `RhetorikGym.jsx` (Zeilen 36-44)
- `GameSession.jsx` (Zeilen 37-43)
- `SimulatorSession.jsx` (Zeilen 34-39)
- `ImmediateFeedback.jsx` (Zeilen 22-28)

**Lösung:** Neue Datei `/src/config/colors.js`
```javascript
export const COLORS = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  red: { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626' },
  green: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a' },
  amber: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 500: '#a855f7', 600: '#9333ea' },
  teal: { 500: '#3DA389', 600: '#2E8A72' },
};
```

---

### 1.2 Formatting Utilities
**Aufwand:** 1 Stunde
**Betroffene Dateien:** 4+ Komponenten

**Problem:** `formatDuration`, `formatTime`, `formatDate` mehrfach implementiert

**Lösung:** Neue Datei `/src/utils/formatting.js`
```javascript
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';
  const defaults = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('de-DE', { ...defaults, ...options });
};

export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
```

---

### 1.3 Security Utilities
**Aufwand:** 30 Minuten

**Problem:** API-Key Maskierung dupliziert in `gemini.js`, `elevenlabs.js`

**Lösung:** Neue Datei `/src/utils/security.js`
```javascript
export const maskSensitiveValue = (value, visibleStart = 8, visibleEnd = 4) => {
  if (!value || value.length < visibleStart + visibleEnd) return '***';
  return `${value.substring(0, visibleStart)}...${value.substring(value.length - visibleEnd)}`;
};
```

---

## Phase 2: Custom React Hooks (1 Tag)

### 2.1 useMobile Hook
**Aufwand:** 1 Stunde
**Betroffene Dateien:** 6+ Komponenten

**Problem:** Identischer Code für Mobile-Detection:
```javascript
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

**Lösung:** Neue Datei `/src/hooks/useMobile.js`
```javascript
import { useState, useEffect } from 'react';

export const useMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

// Zusätzlich: Tablet-Detection
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};
```

**Verwendung:**
```javascript
// Vorher (in jeder Komponente):
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
useEffect(() => { ... }, []);

// Nachher:
const isMobile = useMobile();
```

---

### 2.2 useBranding Hook
**Aufwand:** 1 Stunde
**Betroffene Dateien:** 5+ Komponenten

**Problem:** Branding-Extraktion wiederholt sich:
```javascript
const { branding } = usePartner();
const headerGradient = branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'];
const primaryAccent = branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'];
// ... etc
```

**Lösung:** Neue Datei `/src/hooks/useBranding.js`
```javascript
import { useMemo } from 'react';
import { usePartner } from '../context/PartnerContext';
import { DEFAULT_BRANDING } from '../config/partners';

export const useBranding = () => {
  const { branding } = usePartner();

  return useMemo(() => ({
    headerGradient: branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'],
    headerText: branding?.['--header-text'] || DEFAULT_BRANDING['--header-text'],
    primaryAccent: branding?.['--primary-accent'] || DEFAULT_BRANDING['--primary-accent'],
    primaryAccentLight: branding?.['--primary-accent-light'] || DEFAULT_BRANDING['--primary-accent-light'],
    buttonGradient: branding?.['--button-gradient'] || branding?.['--header-gradient'] || DEFAULT_BRANDING['--header-gradient'],
    sidebarBg: branding?.['--sidebar-bg'] || DEFAULT_BRANDING['--sidebar-bg'],
    cardBg: branding?.['--card-bg'] || '#ffffff',
  }), [branding]);
};
```

---

### 2.3 useAudioRecording Hook
**Aufwand:** 2 Stunden
**Betroffene Dateien:** 3 Komponenten (SimulatorSession, GameSession, RoleplaySession)

**Problem:** Audio-Recording-Logik mit MediaRecorder, AudioContext, Timer dupliziert

**Lösung:** Neue Datei `/src/hooks/useAudioRecording.js`
```javascript
export const useAudioRecording = (options = {}) => {
  const { onComplete, maxDuration, deviceId } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  // MediaRecorder, AudioContext, Timer Logic...

  return {
    isRecording,
    audioLevel,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
  };
};
```

---

## Phase 3: Shared UI Components (1-2 Tage)

### 3.1 ConfirmationDialog Component
**Aufwand:** 1.5 Stunden
**Betroffene Dateien:** SimulatorSession, VideoTrainingSession, RoleplaySession

**Problem:** Zwei fast identische Bestätigungs-Dialoge in SimulatorSession (Zeilen 1060-1237)

**Lösung:** Neue Datei `/src/components/ui/ConfirmationDialog.jsx`
```javascript
const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  icon: Icon = AlertCircle,
  iconBgColor = '#fef2f2',
  iconColor = '#ef4444',
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  confirmVariant = 'danger', // 'danger' | 'success' | 'primary'
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop">
      <div className="dialog-content">
        <div className="dialog-icon" style={{ background: iconBgColor }}>
          <Icon color={iconColor} />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dialog-actions">
          <button onClick={onCancel}>{cancelText}</button>
          <button onClick={onConfirm} className={confirmVariant}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};
```

---

### 3.2 ProgressBar Component (Vereinheitlicht)
**Aufwand:** 1 Stunde

**Problem:** Verschiedene ProgressBar-Implementierungen in Simulator, VideoTraining

**Lösung:** Erweitern `/src/components/ui/ProgressBar.jsx`
```javascript
const ProgressBar = ({
  current,
  total,
  showDots = true,
  showPercentage = true,
  accentColor,
  height = 8,
}) => { ... };
```

---

### 3.3 Timer/Countdown Component
**Aufwand:** 1 Stunde

**Problem:** Timer-Anzeigen unterschiedlich implementiert

**Lösung:** Neue Datei `/src/components/ui/Timer.jsx`
```javascript
const Timer = ({
  seconds,
  format = 'mm:ss', // 'mm:ss' | 'hh:mm:ss' | 'seconds'
  size = 'md',
  variant = 'default', // 'default' | 'countdown' | 'recording'
  onComplete,
}) => { ... };
```

---

### 3.4 ErrorState Component
**Aufwand:** 1 Stunde

**Problem:** Fehler-Anzeigen variieren

**Lösung:** Neue Datei `/src/components/ui/ErrorState.jsx`
```javascript
const ErrorState = ({
  error,
  title = 'Ein Fehler ist aufgetreten',
  icon: Icon = AlertCircle,
  onRetry,
  retryText = 'Erneut versuchen',
  showDetails = false,
}) => { ... };
```

---

### 3.5 Accordion/Collapsible Component
**Aufwand:** 1 Stunde

**Problem:** `CollapsibleSection` und `QuestionTips` sind fast identisch

**Lösung:** Vereinheitlichen als `/src/components/ui/Accordion.jsx`

---

## Phase 4: PHP Backend Refactoring (1-2 Tage)

### 4.1 Singleton Trait
**Aufwand:** 30 Minuten
**Betroffene Dateien:** 5 Database-Klassen, 3 API-Klassen

**Problem:** Identisches Singleton-Pattern in 8+ Klassen

**Lösung:** Neue Datei `/includes/trait-singleton.php`
```php
trait Bewerbungstrainer_Singleton {
    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // Prevent cloning and unserialization
    private function __clone() {}
    public function __wakeup() { throw new Exception("Cannot unserialize singleton"); }
}
```

---

### 4.2 Base Database Class
**Aufwand:** 3 Stunden
**Betroffene Dateien:** Alle 5 Database-Klassen

**Problem:** CRUD-Operationen wiederholen sich (~2.200 Zeilen duplizierter Code)

**Lösung:** Neue Datei `/includes/class-base-database.php`
```php
abstract class Bewerbungstrainer_Base_Database {
    use Bewerbungstrainer_Singleton;

    protected $table_name;
    protected $json_fields = array();

    // Generic CRUD methods
    protected function generic_create($data, $defaults, $sanitize_map) { ... }
    protected function generic_update($id, $data, $allowed_fields) { ... }
    protected function generic_delete($id, $user_id = null) { ... }
    protected function generic_get_by_user($user_id, $args) { ... }

    // JSON helpers
    protected function encode_json_fields(&$data) { ... }
    protected function decode_json_fields(&$object) { ... }

    // Query helpers
    protected function build_where_clause($args, $field_mappings) { ... }
    protected function validate_orderby($orderby, $allowed) { ... }
}
```

---

### 4.3 Base API Class
**Aufwand:** 1.5 Stunden
**Betroffene Dateien:** 3 API-Klassen

**Lösung:** Neue Datei `/includes/class-base-api.php`
```php
abstract class Bewerbungstrainer_Base_API {
    use Bewerbungstrainer_Singleton;

    protected $namespace = 'bewerbungstrainer/v1';
    protected $db;

    // Common permission callbacks
    public function check_user_logged_in() { return is_user_logged_in(); }
    public function allow_all_users() { return true; }

    // Response helpers
    protected function success_response($data, $status = 200) { ... }
    protected function error_response($code, $message, $status = 400) { ... }

    // Demo code handling
    protected function handle_demo_code($demo_code) { ... }
}
```

---

## Phase 5: Service Layer Konsolidierung (Optional)

### 5.1 Unified Error Handler
**Aufwand:** 1.5 Stunden

**Problem:** 3+ verschiedene Error-Handling-Implementierungen

**Lösung:** Neue Datei `/src/utils/errorHandler.js`
```javascript
export class APIError extends Error {
  constructor(message, code, isRetryable = false, originalError = null) {
    super(message);
    this.code = code;
    this.isRetryable = isRetryable;
    this.originalError = originalError;
  }
}

export const classifyError = (error, context) => { ... };
export const getErrorMessage = (error, context) => { ... };
export const isRetryableError = (error) => { ... };
```

---

### 5.2 Retry Utility
**Aufwand:** 1 Stunde

**Problem:** Retry-Logik mit Backoff dupliziert

**Lösung:** Neue Datei `/src/utils/retry.js`
```javascript
export const withRetry = async (fn, options = {}) => {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) throw error;
      await sleep(Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay));
    }
  }
};
```

---

## Zusammenfassung der neuen Dateien

### Frontend (React)
```
/src/
├── config/
│   └── colors.js                 (NEU)
├── hooks/
│   ├── useMobile.js              (NEU)
│   ├── useBranding.js            (NEU)
│   └── useAudioRecording.js      (NEU)
├── components/ui/
│   ├── ConfirmationDialog.jsx    (NEU)
│   ├── Timer.jsx                 (NEU)
│   ├── ErrorState.jsx            (NEU)
│   └── Accordion.jsx             (NEU)
└── utils/
    ├── formatting.js             (NEU)
    ├── security.js               (NEU)
    ├── errorHandler.js           (NEU)
    └── retry.js                  (NEU)
```

### Backend (PHP)
```
/includes/
├── trait-singleton.php           (NEU)
├── class-base-database.php       (NEU)
└── class-base-api.php            (NEU)
```

---

## Empfohlene Reihenfolge

| Schritt | Was | Aufwand | Risiko |
|---------|-----|---------|--------|
| 1 | Colors & Formatting Utils | 2h | Niedrig |
| 2 | useMobile + useBranding Hooks | 2h | Niedrig |
| 3 | ConfirmationDialog Component | 1.5h | Niedrig |
| 4 | PHP Singleton Trait | 0.5h | Niedrig |
| 5 | Security Utils | 0.5h | Niedrig |
| 6 | Timer & ErrorState Components | 2h | Niedrig |
| 7 | PHP Base Database Class | 3h | Mittel |
| 8 | useAudioRecording Hook | 2h | Mittel |
| 9 | PHP Base API Class | 1.5h | Mittel |
| 10 | Service Error Handler | 2.5h | Mittel |

---

## Erwartete Vorteile

1. **Code-Reduktion:** ~2.000+ Zeilen weniger
2. **Konsistenz:** Einheitliches Look & Feel
3. **Wartbarkeit:** Änderungen an einer Stelle
4. **Entwicklungsgeschwindigkeit:** Schnellere Feature-Entwicklung
5. **Testbarkeit:** Isolierte, testbare Komponenten
6. **Bundle-Size:** Kleinere JavaScript-Bundles

---

## Risiken & Mitigation

| Risiko | Mitigation |
|--------|------------|
| Breaking Changes | Schrittweise Migration, Tests |
| Komplexität | Gute Dokumentation, TypeScript JSDoc |
| Performance | Memoization, Lazy Loading |

---

**Nächste Schritte:**
1. Plan besprechen und Prioritäten festlegen
2. Mit Quick Wins (Phase 1) beginnen
3. Nach jeder Phase testen und deployen
