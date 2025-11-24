# Quick Start Guide - Refactoring

**Sofort loslegen in 3 Schritten!** 🚀

---

## 🎯 Schritt 1: Dependencies & Setup (15 Min)

```bash
# 1. React Router installieren
npm install react-router-dom@6

# 2. Ordnerstruktur anlegen
mkdir -p src/{modules,shared,routes,pages}
mkdir -p src/shared/{components,hooks,contexts,services,utils}
mkdir -p src/shared/components/{layout,feedback,audio,user,ui,common}
mkdir -p src/shared/services/{api,audio,feedback,storage}
mkdir -p src/modules/interview-trainer/{components,hooks,services}
mkdir -p src/modules/situations-coach/{components,hooks,services}

# 3. Git Branch erstellen
git checkout -b refactor/modular-architecture

# 4. Vite Config anpassen
```

### Vite Config Update

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

---

## 🎯 Schritt 2: Erste Contexts & Hooks (30 Min)

### UserContext erstellen

```bash
# Datei anlegen
touch src/shared/contexts/UserContext.jsx
```

```jsx
// src/shared/contexts/UserContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Implementierung später
    const storedUser = localStorage.getItem('bewerbungstrainer_user_data');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsGuest(true);
    }
    setIsLoading(false);
  }, []);

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    if (isGuest) {
      localStorage.setItem('bewerbungstrainer_user_data', JSON.stringify(updatedUser));
    }
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('bewerbungstrainer_user_data');
  };

  return (
    <UserContext.Provider value={{ user, isGuest, isLoading, updateUser, clearUser }}>
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

### Combined Provider

```bash
touch src/shared/contexts/index.js
```

```jsx
// src/shared/contexts/index.js
import { UserProvider } from './UserContext';

export function AppProviders({ children }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}

export { useUser } from './UserContext';
```

---

## 🎯 Schritt 3: Routing Setup (30 Min)

### Routes Config

```bash
touch src/routes/routes.config.js
touch src/routes/AppRoutes.jsx
```

```js
// src/routes/routes.config.js
export const ROUTES = {
  HOME: '/',
  MODULES: '/modules',
  INTERVIEW: '/interview',
  SITUATIONS: '/situations',
  PROFILE: '/profile',
  HISTORY: '/history',
  WIZARD: '/wizard',
  NOT_FOUND: '*'
};
```

```jsx
// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './routes.config';

// Temporäre Placeholder-Komponenten
function HomePage() {
  return <div className="p-8"><h1 className="text-3xl font-bold">Home</h1></div>;
}

function ModuleSelectorPage() {
  return <div className="p-8"><h1 className="text-3xl font-bold">Module Selector</h1></div>;
}

function NotFoundPage() {
  return <div className="p-8"><h1 className="text-3xl font-bold">404 - Not Found</h1></div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.MODULES} element={<ModuleSelectorPage />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
}
```

### App.jsx Refactoren

```bash
# Alte App.jsx sichern
cp src/App.jsx src/App.jsx.backup

# Neue App.jsx erstellen
```

```jsx
// src/App.jsx (NEU - nur ~40 Zeilen!)
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/shared/contexts';
import AppRoutes from '@/routes/AppRoutes';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <div className="min-h-screen bg-gray-50">
          {/* Header kommt später */}
          <main>
            <AppRoutes />
          </main>
        </div>
      </AppProviders>
    </BrowserRouter>
  );
}
```

### Testen

```bash
npm run dev
```

Öffne http://localhost:5173 - Du solltest "Home" sehen!

Navigiere zu http://localhost:5173/modules - Du solltest "Module Selector" sehen!

---

## ✅ Checkpoint 1: Basisstruktur steht!

Du hast jetzt:
- ✅ Ordnerstruktur
- ✅ React Router
- ✅ UserContext
- ✅ Routing funktioniert
- ✅ App.jsx ist minimal

**Git Commit:**
```bash
git add .
git commit -m "refactor: setup modular architecture foundation

- Add React Router v6
- Create folder structure (modules, shared, routes, pages)
- Implement UserContext
- Setup basic routing
- Refactor App.jsx to ~40 lines"
```

---

## 🎯 Nächste Schritte (wähle einen)

### Option A: Header migrieren (Quick Win)

```bash
# Header nach shared verschieben
mkdir -p src/shared/components/layout
cp src/components/Header.jsx src/shared/components/layout/Header.jsx
```

Dann in `App.jsx` importieren:
```jsx
import Header from '@/shared/components/layout/Header';

<div className="min-h-screen bg-gray-50">
  <Header />
  <main>
    <AppRoutes />
  </main>
</div>
```

### Option B: UserWizard migrieren

```bash
mkdir -p src/shared/components/user
cp src/components/UserWizard.jsx src/shared/components/user/UserWizard.jsx
```

Wizard-Route hinzufügen:
```jsx
// In AppRoutes.jsx
import UserWizard from '@/shared/components/user/UserWizard';

<Route path={ROUTES.WIZARD} element={<UserWizard />} />
```

### Option C: Services extrahieren

```bash
mkdir -p src/shared/services/api
touch src/shared/services/api/wordpressApi.js
touch src/shared/services/api/geminiApi.js
touch src/shared/services/api/elevenlabsApi.js
```

Dann migriere `src/services/gemini.js` → `@/shared/services/api/geminiApi.js`

---

## 📚 Vollständige Dokumentation

- **Architektur-Übersicht**: `docs/architecture/REFACTORING_ARCHITECTURE.md`
- **Detaillierter Plan**: `docs/architecture/IMPLEMENTATION_PLAN.md`
- **Dieser Guide**: `docs/architecture/QUICK_START.md`

---

## 🆘 Troubleshooting

### Error: "Cannot find module '@/...'"

→ Vite Config überprüfen. Path Alias `@` muss definiert sein.

### Error: "useUser must be used within UserProvider"

→ Stelle sicher, dass `<AppProviders>` in `App.jsx` die gesamte App umschließt.

### Routes funktionieren nicht

→ Prüfe, ob `<BrowserRouter>` korrekt um alles herum ist.
→ Öffne React DevTools und schaue, ob Routes gemountet werden.

---

## 🎉 Du bist bereit!

Die Basis steht. Jetzt kannst du Schritt für Schritt die alten Komponenten migrieren.

**Viel Erfolg!** 🚀
